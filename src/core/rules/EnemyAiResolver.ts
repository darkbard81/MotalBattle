import { Board } from "../board/Board";
import type { Unit } from "../unit/Unit";
import type { Vec2 } from "../types/common";
import { BattleResolver } from "./BattleResolver";
import { HazardResolver, type HazardEvent } from "./HazardResolver";
import type { BattleEvent } from "./RuleTypes";

type TargetStrategy = "nearest" | "lowest-defense";

export interface EnemyAiAction {
  enemyId: string;
  targetId?: string;
  strategy?: TargetStrategy;
  movedFrom?: Vec2;
  movedTo?: Vec2;
  attackEvent?: BattleEvent;
}

export interface EnemyAiTurnResult {
  actions: EnemyAiAction[];
  triggeredBattles: BattleEvent[];
  triggeredHazards: HazardEvent[];
  defeatedUnitIds: string[];
}

function getManhattanDistance(from: Vec2, to: Vec2): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

function compareUnitsByPosition(a: Unit, b: Unit): number {
  if (a.gridPos.y !== b.gridPos.y) {
    return a.gridPos.y - b.gridPos.y;
  }

  if (a.gridPos.x !== b.gridPos.x) {
    return a.gridPos.x - b.gridPos.x;
  }

  return a.id.localeCompare(b.id);
}

function compareTargets(reference: Unit, a: Unit, b: Unit): number {
  const distanceDelta =
    getManhattanDistance(reference.gridPos, a.gridPos) -
    getManhattanDistance(reference.gridPos, b.gridPos);
  if (distanceDelta !== 0) {
    return distanceDelta;
  }

  return compareUnitsByPosition(a, b);
}

function createSingleAttackEvent(attacker: Unit, target: Unit): BattleEvent {
  return {
    attackerIds: [attacker.id],
    targetId: target.id,
    targetPosition: { ...target.gridPos },
    damage: attacker.atk,
    pattern: "single-attack"
  };
}

export class EnemyAiResolver {
  constructor(
    private readonly random: () => number = Math.random,
    private readonly battleResolver: BattleResolver = new BattleResolver(),
    private readonly hazardResolver: HazardResolver = new HazardResolver()
  ) {}

  resolve(board: Board): EnemyAiTurnResult {
    const actions: EnemyAiAction[] = [];
    const triggeredBattles: BattleEvent[] = [];
    const defeatedUnitIds: string[] = [];

    const enemies = board.getAllUnits()
      .filter((unit) => unit.isAlive() && unit.team === "enemy")
      .sort(compareUnitsByPosition);

    for (const enemy of enemies) {
      if (!enemy.isAlive() || enemy.state.stunned || enemy.state.hasActed) {
        continue;
      }

      const targetSelection = this.selectTarget(board, enemy);
      const action: EnemyAiAction = {
        enemyId: enemy.id,
        targetId: targetSelection?.target.id,
        strategy: targetSelection?.strategy
      };

      if (!targetSelection) {
        actions.push(action);
        continue;
      }

      const attackBeforeMove = this.tryCreateAttack(enemy, targetSelection.target);
      if (attackBeforeMove) {
        action.attackEvent = attackBeforeMove;
        triggeredBattles.push(attackBeforeMove);
        defeatedUnitIds.push(...this.battleResolver.apply(board, [attackBeforeMove]));
        actions.push(action);
        continue;
      }

      const moveTarget = this.chooseStepTowardTarget(board, enemy, targetSelection.target);
      if (moveTarget) {
        action.movedFrom = { ...enemy.gridPos };
        board.moveUnit(enemy.id, moveTarget.x, moveTarget.y);
        action.movedTo = { ...moveTarget };
      }

      const refreshedTarget = board.getUnit(targetSelection.target.id);
      if (refreshedTarget && refreshedTarget.isAlive()) {
        const attackAfterMove = this.tryCreateAttack(enemy, refreshedTarget);
        if (attackAfterMove) {
          action.attackEvent = attackAfterMove;
          triggeredBattles.push(attackAfterMove);
          defeatedUnitIds.push(...this.battleResolver.apply(board, [attackAfterMove]));
        }
      }

      actions.push(action);
    }

    const sandwichBattles = this.battleResolver.resolve(board);
    triggeredBattles.push(...sandwichBattles);
    defeatedUnitIds.push(...this.battleResolver.apply(board, sandwichBattles));

    const hazards = this.hazardResolver.resolve(board);
    defeatedUnitIds.push(...this.hazardResolver.apply(board, hazards));

    return {
      actions,
      triggeredBattles,
      triggeredHazards: hazards,
      defeatedUnitIds: [...new Set(defeatedUnitIds)]
    };
  }

  private selectTarget(
    board: Board,
    enemy: Unit
  ): { target: Unit; strategy: TargetStrategy } | null {
    const allies = board.getAllUnits()
      .filter((unit) => unit.isAlive() && unit.team === "ally");

    if (allies.length === 0) {
      return null;
    }

    if (this.random() < 0.5) {
      const target = [...allies].sort((a, b) => compareTargets(enemy, a, b))[0];
      return {
        target,
        strategy: "nearest"
      };
    }

    const target = [...allies].sort((a, b) => {
      if (a.def !== b.def) {
        return a.def - b.def;
      }

      return compareTargets(enemy, a, b);
    })[0];

    return {
      target,
      strategy: "lowest-defense"
    };
  }

  private tryCreateAttack(enemy: Unit, target: Unit): BattleEvent | null {
    if (getManhattanDistance(enemy.gridPos, target.gridPos) !== 1) {
      return null;
    }

    return createSingleAttackEvent(enemy, target);
  }

  private chooseStepTowardTarget(board: Board, enemy: Unit, target: Unit): Vec2 | null {
    const currentDistance = getManhattanDistance(enemy.gridPos, target.gridPos);
    const candidates = [
      { x: enemy.gridPos.x + 1, y: enemy.gridPos.y },
      { x: enemy.gridPos.x - 1, y: enemy.gridPos.y },
      { x: enemy.gridPos.x, y: enemy.gridPos.y + 1 },
      { x: enemy.gridPos.x, y: enemy.gridPos.y - 1 }
    ].filter((cell) => {
      if (!board.isInside(cell.x, cell.y) || board.isBlockedForMove(cell.x, cell.y)) {
        return false;
      }

      return board.isEmpty(cell.x, cell.y);
    });

    const improvingMoves = candidates.filter(
      (cell) => getManhattanDistance(cell, target.gridPos) < currentDistance
    );

    if (improvingMoves.length === 0) {
      return null;
    }

    return improvingMoves.sort((a, b) => {
      const distanceDelta = getManhattanDistance(a, target.gridPos) - getManhattanDistance(b, target.gridPos);
      if (distanceDelta !== 0) {
        return distanceDelta;
      }

      if (a.y !== b.y) {
        return a.y - b.y;
      }

      return a.x - b.x;
    })[0];
  }
}
