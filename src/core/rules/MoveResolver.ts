import { Board } from "../board/Board";
import { addVec2, isSameVec2, subtractVec2, type Vec2 } from "../types/common";
import { PushResolver } from "./PushResolver";
import type { MoveIntent, MoveResult } from "./RuleTypes";

function isCardinalStep(delta: Vec2): boolean {
  return Math.abs(delta.x) + Math.abs(delta.y) === 1;
}

export class MoveResolver {
  constructor(private readonly pushResolver: PushResolver = new PushResolver()) {}

  resolve(board: Board, intent: MoveIntent): MoveResult {
    const unit = board.getUnit(intent.unitId);

    if (!unit) {
      return this.fail(board, "UNIT_NOT_FOUND");
    }

    if (!unit.isAlive()) {
      return this.fail(board, "UNIT_DEAD");
    }

    if (unit.state.stunned) {
      return this.fail(board, "UNIT_STUNNED");
    }

    if (unit.state.hasActed) {
      return this.fail(board, "UNIT_ALREADY_ACTED");
    }

    if (!isSameVec2(unit.gridPos, intent.start)) {
      return this.fail(board, "INVALID_START");
    }

    if (intent.path.length === 0) {
      return this.fail(board, "EMPTY_PATH");
    }

    if (!isSameVec2(intent.path[intent.path.length - 1], intent.finalTarget)) {
      return this.fail(board, "INVALID_START");
    }

    let current = { ...intent.start };
    const movedUnitIds: string[] = [];

    for (const step of intent.path) {
      if (!board.isInside(step.x, step.y)) {
        return this.fail(board, "OUT_OF_BOUNDS");
      }

      const delta = subtractVec2(step, current);
      if (!isCardinalStep(delta)) {
        return this.fail(board, "NON_CARDINAL_STEP");
      }

      if (board.isBlockedForMove(step.x, step.y)) {
        return this.fail(board, "BLOCKED_BY_TERRAIN");
      }

      const occupant = board.getUnitAt(step.x, step.y);
      if (occupant) {
        const pushResult = this.pushResolver.resolve(board, unit.team, step, delta);
        if (!pushResult.success) {
          return this.fail(board, pushResult.failedReason ?? "PUSH_CHAIN_BLOCKED");
        }

        movedUnitIds.push(...pushResult.movedUnitIds);
      }

      board.moveUnit(unit.id, step.x, step.y);
      current = addVec2(current, delta);
    }

    movedUnitIds.unshift(unit.id);
    unit.state.hasMoved = true;

    return {
      success: true,
      movedUnitIds,
      finalPositions: board.clonePositions(),
      triggeredBattles: [],
      triggeredHazards: []
    };
  }

  private fail(
    board: Board,
    failedReason: MoveResult["failedReason"]
  ): MoveResult {
    return {
      success: false,
      movedUnitIds: [],
      finalPositions: board.clonePositions(),
      triggeredBattles: [],
      triggeredHazards: [],
      failedReason
    };
  }
}
