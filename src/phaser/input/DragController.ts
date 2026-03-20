import Phaser from "phaser";
import type { Board } from "../../core/board/Board";
import { BattleResolver } from "../../core/rules/BattleResolver";
import {
  DragInteractionResolver,
  type DragInteractionResult
} from "../../core/rules/DragInteractionResolver";
import { EnemyAiResolver } from "../../core/rules/EnemyAiResolver";
import { HazardResolver } from "../../core/rules/HazardResolver";
import type { Vec2 } from "../../core/types/common";
import type { BattleEvent } from "../../core/rules/RuleTypes";
import {
  debugBattleResult,
  debugDragStart,
  debugDragStep,
  debugEnemyTurn
} from "../../game/debug";
import { BoardView } from "../objects/BoardView";
import { getBlockedPreviewWorld, isPointerOnBlockedCell } from "./dragPreview";

interface DragControllerCallbacks {
  onSelectionChange: (unitId: string | null) => void;
  onStatus: (message: string) => void;
  onBoardChange: () => void;
  onBattleResolved: (summary: string) => void;
  onBlock: (payload: {
    cell: Vec2;
    reason:
      | "OUT_OF_BOUNDS"
      | "BLOCKED_BY_TERRAIN"
      | "BLOCKED_BY_ENEMY"
      | "UNIT_STUNNED"
      | "UNIT_ALREADY_ACTED";
  }) => void;
  onBattleEvents: (payload: {
    playerBattleEvents: BattleEvent[];
    battleEvents: BattleEvent[];
    hitTargetIds: string[];
    defeatedUnitIds: string[];
    hazardTargetIds: string[];
  }) => void;
  onTimerChange: (state: {
    active: boolean;
    remainingMs: number;
    totalMs: number;
  }) => void;
  onSwap: (payload: {
    activeUnitId: string;
    swappedUnitId: string;
    swappedFrom: Vec2;
    swappedTo: Vec2;
  }) => void;
  onPreview: (preview: {
    unitId: string | null;
    pointerWorld: Vec2 | null;
    cell: Vec2 | null;
    kind: "move" | "swap" | "block" | "idle";
  }) => void;
}

export class DragController {
  private static readonly DRAG_DURATION_MS = 5000;
  private selectedUnitId: string | null = null;
  private pointerCell: Vec2 | null = null;
  private blockedDirection: Vec2 | null = null;
  private blockedCell: Vec2 | null = null;
  private dragTimer?: Phaser.Time.TimerEvent;
  private timerTicker?: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly board: Board,
    private readonly boardView: BoardView,
    private readonly callbacks: DragControllerCallbacks,
    private readonly interactionResolver: DragInteractionResolver = new DragInteractionResolver(),
    private readonly battleResolver: BattleResolver = new BattleResolver(),
    private readonly hazardResolver: HazardResolver = new HazardResolver(),
    private readonly enemyAiResolver: EnemyAiResolver = new EnemyAiResolver()
  ) {}

  bind(): void {
    this.scene.input.on("pointerdown", this.handlePointerDown, this);
    this.scene.input.on("pointermove", this.handlePointerMove, this);
    this.scene.input.on("pointerup", this.handlePointerUp, this);
  }

  destroy(): void {
    this.scene.input.off("pointerdown", this.handlePointerDown, this);
    this.scene.input.off("pointermove", this.handlePointerMove, this);
    this.scene.input.off("pointerup", this.handlePointerUp, this);
    this.dragTimer?.remove(false);
    this.dragTimer = undefined;
    this.timerTicker?.remove(false);
    this.timerTicker = undefined;
  }

  getSelectedUnitId(): string | null {
    return this.selectedUnitId;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const cell = this.boardView.worldToGrid(pointer.worldX, pointer.worldY);
    if (!cell) {
      return;
    }

    const unit = this.board.getUnitAt(cell.x, cell.y);
    if (!unit || unit.team !== "ally") {
      return;
    }

    this.selectedUnitId = unit.id;
    this.pointerCell = { ...cell };
    this.blockedDirection = null;
    this.blockedCell = null;
    this.callbacks.onSelectionChange(this.selectedUnitId);
    this.callbacks.onPreview({
      unitId: unit.id,
      pointerWorld: { x: pointer.worldX, y: pointer.worldY },
      cell,
      kind: "idle"
    });
    this.callbacks.onStatus(`Selected ${unit.id}. You have 5 seconds to drag.`);
    this.dragTimer?.remove(false);
    this.timerTicker?.remove(false);
    this.callbacks.onTimerChange({
      active: true,
      remainingMs: DragController.DRAG_DURATION_MS,
      totalMs: DragController.DRAG_DURATION_MS
    });
    this.dragTimer = this.scene.time.delayedCall(DragController.DRAG_DURATION_MS, () => {
      this.finalizeDrag("Time ended. Resolving current board state.");
    });
    this.timerTicker = this.scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (!this.dragTimer) {
          return;
        }

        const remainingMs = Math.max(0, this.dragTimer.getRemaining());
        this.callbacks.onTimerChange({
          active: true,
          remainingMs,
          totalMs: DragController.DRAG_DURATION_MS
        });
      }
    });
    debugDragStart({
      unitId: unit.id,
      startCell: cell,
      durationMs: DragController.DRAG_DURATION_MS
    });
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown || !this.selectedUnitId) {
      return;
    }

    const activeUnit = this.board.getUnit(this.selectedUnitId);
    if (!activeUnit) {
      return;
    }

    const targetCell = this.boardView.worldToGrid(pointer.worldX, pointer.worldY);
    if (!targetCell) {
      this.blockedDirection = null;
      this.blockedCell = null;
      this.callbacks.onPreview({
        unitId: this.selectedUnitId,
        pointerWorld: { x: pointer.worldX, y: pointer.worldY },
        cell: null,
        kind: "idle"
      });
      return;
    }

    if (this.blockedDirection) {
      if (isPointerOnBlockedCell(targetCell, this.blockedCell)) {
        const previewWorld = getBlockedPreviewWorld(
          { x: pointer.worldX, y: pointer.worldY },
          this.boardView.gridToWorld(activeUnit.gridPos.x, activeUnit.gridPos.y),
          this.blockedDirection,
          this.boardView.tileSize
        );
        this.callbacks.onPreview({
          unitId: this.selectedUnitId,
          pointerWorld: previewWorld,
          cell: targetCell,
          kind: "block"
        });
        return;
      }

      this.blockedDirection = null;
      this.blockedCell = null;
    }

    if (this.pointerCell && this.pointerCell.x === targetCell.x && this.pointerCell.y === targetCell.y) {
      this.callbacks.onPreview({
        unitId: this.selectedUnitId,
        pointerWorld: { x: pointer.worldX, y: pointer.worldY },
        cell: targetCell,
        kind: "idle"
      });
      return;
    }

    const result = this.interactionResolver.step(this.board, this.selectedUnitId, targetCell);
    this.pointerCell =
      result.kind === "block" ? { ...result.activePosition } : { ...targetCell };
    this.blockedDirection =
      result.kind === "block"
      ? {
          x: Math.sign(targetCell.x - result.activePosition.x),
          y: Math.sign(targetCell.y - result.activePosition.y)
        }
      : null;
    this.blockedCell = result.kind === "block" ? { ...targetCell } : null;
    this.handleInteractionResult(result, targetCell);
    const previewWorld =
      result.kind === "block"
        ? getBlockedPreviewWorld(
            { x: pointer.worldX, y: pointer.worldY },
            this.boardView.gridToWorld(result.activePosition.x, result.activePosition.y),
            this.blockedDirection ?? { x: 0, y: 0 },
            this.boardView.tileSize
          )
        : { x: pointer.worldX, y: pointer.worldY };
    this.callbacks.onPreview({
      unitId: this.selectedUnitId,
      pointerWorld: previewWorld,
      cell: targetCell,
      kind: result.kind === "none" ? "idle" : result.kind
    });
  }

  private handlePointerUp(): void {
    if (!this.selectedUnitId) {
      return;
    }

    this.finalizeDrag("Pointer released. Resolving current board state.");
  }

  private handleInteractionResult(result: DragInteractionResult, targetCell: Vec2): void {
    if (result.kind === "none") {
      return;
    }

    if (result.kind === "block") {
      debugDragStep({
        unitId: result.activeUnitId,
        targetCell,
        result: result.kind,
        reason: result.reason
      });
      if (result.reason) {
        this.callbacks.onBlock({
          cell: targetCell,
          reason: result.reason
        });
      }
      this.callbacks.onStatus(
        result.reason === "BLOCKED_BY_ENEMY"
          ? "Blocked by enemy tile."
          : result.reason === "UNIT_STUNNED"
            ? "Cannot move: unit is stunned."
            : result.reason === "UNIT_ALREADY_ACTED"
              ? "Cannot move: unit has already acted."
              : "Blocked by obstacle tile."
      );
      return;
    }

    this.callbacks.onBoardChange();

    if (result.kind === "move") {
      debugDragStep({
        unitId: result.activeUnitId,
        targetCell,
        result: result.kind
      });
      this.callbacks.onStatus(`Moved to (${result.activePosition.x}, ${result.activePosition.y}).`);
      return;
    }

    if (result.swappedUnitId && result.swappedFrom && result.swappedTo) {
      debugDragStep({
        unitId: result.activeUnitId,
        targetCell,
        result: result.kind,
        swappedUnitId: result.swappedUnitId
      });
      this.callbacks.onSwap({
        activeUnitId: result.activeUnitId,
        swappedUnitId: result.swappedUnitId,
        swappedFrom: result.swappedFrom,
        swappedTo: result.swappedTo
      });
    }
    this.callbacks.onStatus(`Swapped with ${result.swappedUnitId}.`);
  }

  private finalizeDrag(statusMessage: string): void {
    if (!this.selectedUnitId) {
      return;
    }

    this.dragTimer?.remove(false);
    this.dragTimer = undefined;
    this.timerTicker?.remove(false);
    this.timerTicker = undefined;
    this.callbacks.onTimerChange({
      active: false,
      remainingMs: 0,
      totalMs: DragController.DRAG_DURATION_MS
    });

    const events = this.battleResolver.resolve(this.board);
    const hitTargetIds = events.map((event) => event.targetId);
    const defeatedFromBattle = this.battleResolver.apply(this.board, events);
    const hazardEvents = this.hazardResolver.resolve(this.board);
    const defeatedFromHazard = this.hazardResolver.apply(this.board, hazardEvents);
    const defeated = [...defeatedFromBattle, ...defeatedFromHazard];
    const enemyTurnResult = this.enemyAiResolver.resolve(this.board);
    const allHitTargetIds = [
      ...hitTargetIds,
      ...enemyTurnResult.triggeredBattles.map((event) => event.targetId)
    ];
    const allDefeatedUnitIds = [...defeated, ...enemyTurnResult.defeatedUnitIds];
    const allHazardTargetIds = [
      ...hazardEvents.map((event) => event.unitId),
      ...enemyTurnResult.triggeredHazards.map((event) => event.unitId)
    ];

    debugBattleResult({
      eventCount: events.length + enemyTurnResult.triggeredBattles.length,
      hitTargetIds: allHitTargetIds,
      defeatedUnitIds: allDefeatedUnitIds,
      positions: this.board.clonePositions()
    });
    debugEnemyTurn({
      actionCount: enemyTurnResult.actions.length,
      actions: enemyTurnResult.actions.map((action) => ({
        enemyId: action.enemyId,
        targetId: action.targetId,
        strategy: action.strategy,
        movedTo: action.movedTo,
        attacked: !!action.attackEvent
      })),
      defeatedUnitIds: enemyTurnResult.defeatedUnitIds
    });

    const summary = `Battles: ${events.length + enemyTurnResult.triggeredBattles.length}. Defeated: ${allDefeatedUnitIds.length > 0 ? allDefeatedUnitIds.join(", ") : "none"}`;
    this.callbacks.onBattleEvents({
      playerBattleEvents: events,
      battleEvents: [...events, ...enemyTurnResult.triggeredBattles],
      hitTargetIds: allHitTargetIds,
      defeatedUnitIds: allDefeatedUnitIds,
      hazardTargetIds: allHazardTargetIds
    });
    this.callbacks.onBoardChange();
    this.callbacks.onStatus(
      enemyTurnResult.actions.length > 0
        ? `${statusMessage} Enemy turn resolved.`
        : statusMessage
    );
    this.callbacks.onBattleResolved(summary);
    this.clearSelection();
  }

  private clearSelection(): void {
    this.selectedUnitId = null;
    this.pointerCell = null;
    this.blockedDirection = null;
    this.blockedCell = null;
    this.dragTimer?.remove(false);
    this.dragTimer = undefined;
    this.timerTicker?.remove(false);
    this.timerTicker = undefined;
    this.callbacks.onPreview({
      unitId: null,
      pointerWorld: null,
      cell: null,
      kind: "idle"
    });
    this.callbacks.onTimerChange({
      active: false,
      remainingMs: 0,
      totalMs: DragController.DRAG_DURATION_MS
    });
    this.callbacks.onSelectionChange(null);
  }

}
