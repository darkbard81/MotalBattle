import { Board } from "../board/Board";
import type { BattleEvent } from "./RuleTypes";

const SANDWICH_PATTERNS = [
  {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    pattern: "sandwich-horizontal" as const
  },
  {
    left: { x: 0, y: -1 },
    right: { x: 0, y: 1 },
    pattern: "sandwich-vertical" as const
  }
];

export class BattleResolver {
  resolve(board: Board): BattleEvent[] {
    const events: BattleEvent[] = [];

    for (const unit of board.getAllUnits()) {
      if (!unit.isAlive() || unit.team !== "enemy") {
        continue;
      }

      for (const candidate of SANDWICH_PATTERNS) {
        const left = board.getUnitAt(
          unit.gridPos.x + candidate.left.x,
          unit.gridPos.y + candidate.left.y
        );
        const right = board.getUnitAt(
          unit.gridPos.x + candidate.right.x,
          unit.gridPos.y + candidate.right.y
        );

        if (!left || !right) {
          continue;
        }

        if (left.team !== "ally" || right.team !== "ally") {
          continue;
        }

        events.push({
          attackerIds: [left.id, right.id],
          targetId: unit.id,
          targetPosition: { ...unit.gridPos },
          damage: left.atk + right.atk,
          pattern: candidate.pattern
        });
      }
    }

    return events;
  }

  apply(board: Board, events: BattleEvent[]): string[] {
    const defeatedUnitIds: string[] = [];

    for (const event of events) {
      const target = board.getUnit(event.targetId);
      if (!target || !target.isAlive()) {
        continue;
      }

      const appliedDamage = Math.max(0, event.damage - target.def);
      target.applyDamage(appliedDamage);

      if (!target.isAlive()) {
        defeatedUnitIds.push(target.id);
      }
    }

    for (const unitId of defeatedUnitIds) {
      board.removeUnit(unitId);
    }

    return defeatedUnitIds;
  }
}
