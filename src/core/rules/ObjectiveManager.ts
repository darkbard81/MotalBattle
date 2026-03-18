import type { Board } from "../board/Board";
import type { Team } from "../types/enums";

export type ObjectiveStatus = "success" | "fail" | "ongoing";

export interface ObjectiveJudgeContext {
  board: Board;
  currentTurn: number;
  turnLimit?: number;
}

export interface ObjectiveJudge {
  evaluate: (context: ObjectiveJudgeContext) => ObjectiveStatus;
}

export interface DefeatAllObjective {
  type: "defeat_all";
}

export interface SurviveNTurnsObjective {
  type: "survive_n_turns";
  turn?: number;
}

export interface ReachCellObjective {
  type: "reach_cell";
  x: number;
  y: number;
  team: Team;
}

export interface ProtectUnitObjective {
  type: "protect_unit";
  unitId: string;
}

export type StageObjective =
  | DefeatAllObjective
  | SurviveNTurnsObjective
  | ReachCellObjective
  | ProtectUnitObjective;

type ObjectiveJudgeFactory = (objective: StageObjective) => ObjectiveJudge;

const objectiveJudgeFactories: Record<StageObjective["type"], ObjectiveJudgeFactory> = {
  defeat_all: () => ({
    evaluate: ({ board }) => {
      const remainingEnemies = board.getAllUnits().filter((unit) => unit.team === "enemy");
      return remainingEnemies.length === 0 ? "success" : "ongoing";
    }
  }),
  survive_n_turns: (objective) => ({
    evaluate: ({ currentTurn, turnLimit }) => {
      const objectiveTurn = objective.type === "survive_n_turns" ? objective.turn : undefined;
      const targetTurn = objectiveTurn ?? turnLimit;

      if (targetTurn === undefined) {
        return "fail";
      }

      return currentTurn >= targetTurn ? "success" : "ongoing";
    }
  }),
  reach_cell: (objective) => ({
    evaluate: ({ board }) => {
      if (objective.type !== "reach_cell") {
        return "ongoing";
      }

      const unit = board.getUnitAt(objective.x, objective.y);
      return unit?.team === objective.team ? "success" : "ongoing";
    }
  }),
  protect_unit: (objective) => ({
    evaluate: ({ board }) => {
      if (objective.type !== "protect_unit") {
        return "ongoing";
      }

      return board.getUnit(objective.unitId) ? "ongoing" : "fail";
    }
  })
};

export class ObjectiveManager {
  evaluate(objectives: StageObjective[], context: ObjectiveJudgeContext): ObjectiveStatus {
    if (objectives.length === 0) {
      return "ongoing";
    }

    const statuses = objectives.map((objective) => {
      const judge = objectiveJudgeFactories[objective.type](objective);
      return judge.evaluate(context);
    });

    if (statuses.some((status) => status === "fail")) {
      return "fail";
    }

    if (statuses.every((status) => status === "success")) {
      return "success";
    }

    return "ongoing";
  }
}
