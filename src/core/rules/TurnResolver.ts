import { Board } from "../board/Board";
import { BattleResolver } from "./BattleResolver";
import { HazardResolver } from "./HazardResolver";
import { MoveResolver } from "./MoveResolver";
import { ObjectiveManager, type StageObjective } from "./ObjectiveManager";
import type { MoveIntent, TurnResult } from "./RuleTypes";

interface TurnResolverConfig {
  objectives: StageObjective[];
  turnLimit?: number;
}

export class TurnResolver {
  private currentTurn = 0;

  constructor(
    private readonly moveResolver: MoveResolver = new MoveResolver(),
    private readonly battleResolver: BattleResolver = new BattleResolver(),
    private readonly hazardResolver: HazardResolver = new HazardResolver(),
    private readonly objectiveManager: ObjectiveManager = new ObjectiveManager(),
    private readonly config: TurnResolverConfig = { objectives: [] }
  ) {}

  resolve(board: Board, intent: MoveIntent): TurnResult {
    const moveResult = this.moveResolver.resolve(board, intent);
    if (!moveResult.success) {
      return {
        ...moveResult,
        objectiveState: {
          status: this.objectiveManager.evaluate(this.config.objectives, {
            board,
            currentTurn: this.currentTurn,
            turnLimit: this.config.turnLimit
          }),
          currentTurn: this.currentTurn
        }
      };
    }

    const battles = this.battleResolver.resolve(board);
    this.battleResolver.apply(board, battles);
    const hazards = this.hazardResolver.resolve(board);
    this.hazardResolver.apply(board, hazards);
    this.currentTurn += 1;

    return {
      ...moveResult,
      finalPositions: board.clonePositions(),
      triggeredBattles: battles,
      triggeredHazards: hazards,
      objectiveState: {
        status: this.objectiveManager.evaluate(this.config.objectives, {
          board,
          currentTurn: this.currentTurn,
          turnLimit: this.config.turnLimit
        }),
        currentTurn: this.currentTurn
      }
    };
  }
}
