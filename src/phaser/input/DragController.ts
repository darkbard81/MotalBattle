import Phaser from "phaser";
import type { Board } from "../../core/board/Board";
import { BattleResolver } from "../../core/rules/BattleResolver";
import {
  DragInteractionResolver,
  type DragInteractionResult
} from "../../core/rules/DragInteractionResolver";
import { EnemyAiResolver } from "../../core/rules/EnemyAiResolver";
import { HazardResolver } from "../../core/rules/HazardResolver";
import type { BattleEvent } from "../../core/rules/RuleTypes";
import type { Vec2 } from "../../core/types/common";
import {
  debugBattleResult,
  debugDragStart,
  debugDragStep,
  debugEnemyTurn,
  debugSwapStep
} from "../../game/debug";
import { BoardView } from "../objects/BoardView";
import {
  getDiagonalSwapCandidate,
  getFloatingPreviewWorld,
  getNextFloatingCell,
  shouldReleaseBlockedAxis,
  type BlockedAxisLock
} from "./dragPreview";

interface DragControllerCallbacks {
  isInputBlocked: () => boolean;
  onSelectionChange: (unitId: string | null) => void;
  onInspect: (payload: { unitId: string }) => void;
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
  private static readonly HOLD_TO_INSPECT_MS = 1500;
  private static readonly SWAP_REARM_INTENT_RATIO = 0.2;

  private selectedUnitId: string | null = null;
  private pressedCell: Vec2 | null = null;
  private blockedAxisLock: BlockedAxisLock | null = null;
  private swapLock:
    | {
        blockedCell: Vec2;
        directionX: -1 | 0 | 1;
        directionY: -1 | 0 | 1;
        axisMode: "x" | "y" | "xy";
      }
    | null = null;
  private inspectingUnitId: string | null = null;
  private holdTimer?: Phaser.Time.TimerEvent;
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
    this.holdTimer?.remove(false);
    this.holdTimer = undefined;
    this.dragTimer?.remove(false);
    this.dragTimer = undefined;
    this.timerTicker?.remove(false);
    this.timerTicker = undefined;
  }

  getSelectedUnitId(): string | null {
    return this.selectedUnitId;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.callbacks.isInputBlocked()) {
      return;
    }

    const cell = this.boardView.worldToGrid(pointer.worldX, pointer.worldY);
    if (!cell) {
      return;
    }

    const unit = this.board.getUnitAt(cell.x, cell.y);
    if (!unit) {
      return;
    }

    this.clearSelection();
    this.selectedUnitId = unit.id;
    this.pressedCell = { ...cell };
    this.blockedAxisLock = null;
    this.swapLock = null;
    this.callbacks.onSelectionChange(this.selectedUnitId);
    this.callbacks.onPreview({
      unitId: unit.id,
      pointerWorld: { x: pointer.worldX, y: pointer.worldY },
      cell,
      kind: "idle"
    });
    this.callbacks.onTimerChange({
      active: false,
      remainingMs: 0,
      totalMs: DragController.DRAG_DURATION_MS
    });
    this.callbacks.onStatus(
      unit.team === "ally"
        ? `Selected ${unit.id}. You have 5 seconds to drag.`
        : `Selected ${unit.id}. Hold 1.5 seconds for details.`
    );
    if (unit.team === "ally") {
      this.startDrag(unit.id, cell);
      return;
    }

    if (unit.team !== "enemy") {
      return;
    }

    this.holdTimer = this.scene.time.delayedCall(DragController.HOLD_TO_INSPECT_MS, () => {
      if (!this.selectedUnitId || this.selectedUnitId !== unit.id || !this.pressedCell) {
        return;
      }

      this.inspectingUnitId = unit.id;
      this.callbacks.onInspect({ unitId: unit.id });
    });
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.callbacks.isInputBlocked()) {
      return;
    }

    if (!pointer.isDown || !this.selectedUnitId) {
      return;
    }

    const activeUnit = this.board.getUnit(this.selectedUnitId);
    if (!activeUnit) {
      return;
    }

    if (this.inspectingUnitId) {
      return;
    }

    const pointerWorld = { x: pointer.worldX, y: pointer.worldY };
    const hoveredCell = this.boardView.worldToGrid(pointer.worldX, pointer.worldY);

    if (!this.dragTimer) {
      if (
        hoveredCell &&
        this.pressedCell &&
        this.pressedCell.x === hoveredCell.x &&
        this.pressedCell.y === hoveredCell.y
      ) {
        this.callbacks.onPreview({
          unitId: this.selectedUnitId,
          pointerWorld: getFloatingPreviewWorld(
            pointerWorld,
            this.boardView.gridToWorld(activeUnit.gridPos.x, activeUnit.gridPos.y),
            this.boardView.tileSize
          ),
          cell: hoveredCell,
          kind: "idle"
        });
        return;
      }

      this.holdTimer?.remove(false);
      this.holdTimer = undefined;

      if (activeUnit.team !== "ally") {
        this.callbacks.onStatus(`Enemy ${activeUnit.id} cannot be dragged. Hold on the tile to inspect.`);
        return;
      }

      this.startDrag(activeUnit.id, this.pressedCell ?? activeUnit.gridPos);
    }

    if (
      this.blockedAxisLock &&
      shouldReleaseBlockedAxis(pointerWorld, this.blockedAxisLock, {
        originX: this.boardView.originX,
        originY: this.boardView.originY,
        tileSize: this.boardView.tileSize
      })
    ) {
      this.blockedAxisLock = null;
    }

    const activePosition = { ...activeUnit.gridPos };
    const activeWorld = this.boardView.gridToWorld(activePosition.x, activePosition.y);
    if (this.swapLock && this.shouldReleaseSwapLock(pointerWorld, activeWorld)) {
      this.swapLock = null;
    }
    const pointerGridConfig = {
      originX: this.boardView.originX,
      originY: this.boardView.originY,
      tileSize: this.boardView.tileSize
    };
    const diagonalSwapTarget = getDiagonalSwapCandidate(
      this.board,
      activePosition,
      activeWorld,
      pointerWorld,
      this.boardView.tileSize,
      this.blockedAxisLock
    );
    const nextCell =
      (this.isSwapLocked(diagonalSwapTarget) ? null : diagonalSwapTarget) ??
      getNextFloatingCell(
        pointerWorld,
        activePosition,
        activeWorld,
        pointerGridConfig,
        this.blockedAxisLock
      );

    if (!nextCell) {
      this.callbacks.onPreview({
        unitId: this.selectedUnitId,
        pointerWorld: getFloatingPreviewWorld(
          pointerWorld,
          activeWorld,
          this.boardView.tileSize,
          this.blockedAxisLock
        ),
        cell: hoveredCell ?? activePosition,
        kind: this.blockedAxisLock ? "block" : "idle"
      });
      return;
    }

    const result = this.interactionResolver.step(this.board, this.selectedUnitId, nextCell);
    this.blockedAxisLock =
      result.kind === "block"
        ? {
            axis: nextCell.x !== activePosition.x ? "x" : "y",
            direction:
              nextCell.x !== activePosition.x
                ? (Math.sign(nextCell.x - activePosition.x) as -1 | 1)
                : (Math.sign(nextCell.y - activePosition.y) as -1 | 1),
            blockedCell: { ...nextCell }
          }
        : null;
    this.swapLock =
      result.kind === "swap"
        ? this.createSwapLock(activePosition, nextCell)
        : this.swapLock;
    this.handleInteractionResult(result, nextCell);

    const previewWorld = getFloatingPreviewWorld(
      pointerWorld,
      this.boardView.gridToWorld(result.activePosition.x, result.activePosition.y),
      this.boardView.tileSize,
      this.blockedAxisLock
    );
    this.callbacks.onPreview({
      unitId: this.selectedUnitId,
      pointerWorld: previewWorld,
      cell: result.kind === "block" ? nextCell : result.activePosition,
      kind: result.kind === "none" ? "idle" : result.kind
    });
  }

  private handlePointerUp(): void {
    if (this.callbacks.isInputBlocked()) {
      return;
    }

    this.holdTimer?.remove(false);
    this.holdTimer = undefined;

    if (this.inspectingUnitId || !this.dragTimer) {
      this.clearSelection();
      return;
    }

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
              : result.reason === "OUT_OF_BOUNDS"
                ? "Cannot move outside the board."
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
      const swapDirection = {
        x: result.swappedTo.x - result.swappedFrom.x,
        y: result.swappedTo.y - result.swappedFrom.y
      };
      debugSwapStep({
        activeUnitId: result.activeUnitId,
        swappedUnitId: result.swappedUnitId,
        swappedFrom: result.swappedFrom,
        swappedTo: result.swappedTo,
        direction: swapDirection,
        timestampIso: new Date().toISOString(),
        timestampMs: this.scene.time.now
      });
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
    this.pressedCell = null;
    this.blockedAxisLock = null;
    this.swapLock = null;
    this.inspectingUnitId = null;
    this.holdTimer?.remove(false);
    this.holdTimer = undefined;
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

  private isSwapLocked(candidate: Vec2 | null): boolean {
    if (!candidate || !this.swapLock) {
      return false;
    }

    return (
      candidate.x === this.swapLock.blockedCell.x &&
      candidate.y === this.swapLock.blockedCell.y
    );
  }

  private shouldReleaseSwapLock(pointerWorld: Vec2, activeWorld: Vec2): boolean {
    if (!this.swapLock) {
      return true;
    }

    const minIntent =
      this.boardView.tileSize * DragController.SWAP_REARM_INTENT_RATIO;
    const offsetX = pointerWorld.x - activeWorld.x;
    const offsetY = pointerWorld.y - activeWorld.y;
    if (this.swapLock.axisMode === "x") {
      if (Math.abs(offsetX) < minIntent) {
        return true;
      }

      return Math.sign(offsetX) !== this.swapLock.directionX;
    }

    if (this.swapLock.axisMode === "y") {
      if (Math.abs(offsetY) < minIntent) {
        return true;
      }

      return Math.sign(offsetY) !== this.swapLock.directionY;
    }

    if (Math.abs(offsetX) < minIntent || Math.abs(offsetY) < minIntent) {
      return true;
    }

    return (
      Math.sign(offsetX) !== this.swapLock.directionX ||
      Math.sign(offsetY) !== this.swapLock.directionY
    );
  }

  private createSwapLock(activePosition: Vec2, nextCell: Vec2): {
    blockedCell: Vec2;
    directionX: -1 | 0 | 1;
    directionY: -1 | 0 | 1;
    axisMode: "x" | "y" | "xy";
  } {
    const directionX = Math.sign(activePosition.x - nextCell.x) as -1 | 0 | 1;
    const directionY = Math.sign(activePosition.y - nextCell.y) as -1 | 0 | 1;
    const axisMode =
      directionX !== 0 && directionY !== 0 ? "xy" : directionX !== 0 ? "x" : "y";

    return {
      blockedCell: { ...activePosition },
      directionX,
      directionY,
      axisMode
    };
  }

  private startDrag(unitId: string, startCell: Vec2): void {
    this.callbacks.onStatus(`Selected ${unitId}. You have 5 seconds to drag.`);
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
      unitId,
      startCell,
      durationMs: DragController.DRAG_DURATION_MS
    });
  }
}
