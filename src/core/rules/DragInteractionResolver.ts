import { Board } from "../board/Board";
import type { Vec2 } from "../types/common";

export interface DragInteractionResult {
  kind: "move" | "swap" | "block" | "none";
  activeUnitId: string;
  activePosition: Vec2;
  reason?:
    | "OUT_OF_BOUNDS"
    | "BLOCKED_BY_TERRAIN"
    | "BLOCKED_BY_ENEMY"
    | "UNIT_STUNNED"
    | "UNIT_ALREADY_ACTED";
  swappedUnitId?: string;
  swappedFrom?: Vec2;
  swappedTo?: Vec2;
}

export class DragInteractionResolver {
  step(board: Board, activeUnitId: string, target: Vec2): DragInteractionResult {
    const activeUnit = board.getUnit(activeUnitId);
    if (!activeUnit) {
      return {
        kind: "none",
        activeUnitId,
        activePosition: target
      };
    }

    if (activeUnit.state.stunned) {
      return {
        kind: "block",
        activeUnitId,
        activePosition: { ...activeUnit.gridPos },
        reason: "UNIT_STUNNED"
      };
    }

    if (activeUnit.state.hasActed) {
      return {
        kind: "block",
        activeUnitId,
        activePosition: { ...activeUnit.gridPos },
        reason: "UNIT_ALREADY_ACTED"
      };
    }

    if (activeUnit.gridPos.x === target.x && activeUnit.gridPos.y === target.y) {
      return {
        kind: "none",
        activeUnitId,
        activePosition: { ...activeUnit.gridPos }
      };
    }

    if (!board.isInside(target.x, target.y)) {
      return {
        kind: "block",
        activeUnitId,
        activePosition: { ...activeUnit.gridPos },
        reason: "OUT_OF_BOUNDS"
      };
    }

    if (board.isBlockedForMove(target.x, target.y)) {
      return {
        kind: "block",
        activeUnitId,
        activePosition: { ...activeUnit.gridPos },
        reason: "BLOCKED_BY_TERRAIN"
      };
    }

    const occupant = board.getUnitAt(target.x, target.y);
    if (!occupant) {
      board.moveUnit(activeUnitId, target.x, target.y);
      return {
        kind: "move",
        activeUnitId,
        activePosition: { x: target.x, y: target.y }
      };
    }

    if (occupant.team === "enemy") {
      return {
        kind: "block",
        activeUnitId,
        activePosition: { ...activeUnit.gridPos },
        reason: "BLOCKED_BY_ENEMY"
      };
    }

    const swappedFrom = { ...occupant.gridPos };
    const swappedTo = { ...activeUnit.gridPos };
    board.swapUnits(activeUnitId, occupant.id);
    return {
      kind: "swap",
      activeUnitId,
      activePosition: { ...target },
      swappedUnitId: occupant.id,
      swappedFrom,
      swappedTo
    };
  }
}
