import { addVec2, type Vec2 } from "../types/common";
import { Board } from "../board/Board";
import type { Team } from "../types/enums";
import type { PushResult } from "./RuleTypes";

export class PushResolver {
  resolve(board: Board, moverTeam: Team, collision: Vec2, direction: Vec2): PushResult {
    const chain = [];
    let current = { ...collision };

    while (board.isInside(current.x, current.y) && board.getUnitAt(current.x, current.y)) {
      const unit = board.getUnitAt(current.x, current.y);
      if (!unit) {
        break;
      }

      if (unit.team !== moverTeam || unit.team !== "ally") {
        return {
          success: false,
          movedUnitIds: [],
          failedReason: "BLOCKED_BY_ENEMY"
        };
      }

      if (!unit.canBePushed) {
        return {
          success: false,
          movedUnitIds: [],
          failedReason: "IMMOVABLE_UNIT"
        };
      }

      chain.push(unit);
      current = addVec2(current, direction);
    }

    if (!board.isInside(current.x, current.y)) {
      return {
        success: false,
        movedUnitIds: [],
        failedReason: "OUT_OF_BOUNDS"
      };
    }

    if (board.isBlockedForPush(current.x, current.y)) {
      return {
        success: false,
        movedUnitIds: [],
        failedReason: "BLOCKED_BY_TERRAIN"
      };
    }

    if (!board.isEmpty(current.x, current.y)) {
      return {
        success: false,
        movedUnitIds: [],
        failedReason: "PUSH_CHAIN_BLOCKED"
      };
    }

    const movedUnitIds: string[] = [];

    for (let index = chain.length - 1; index >= 0; index -= 1) {
      const unit = chain[index];
      board.moveUnit(unit.id, unit.gridPos.x + direction.x, unit.gridPos.y + direction.y);
      movedUnitIds.push(unit.id);
    }

    return {
      success: true,
      movedUnitIds
    };
  }
}
