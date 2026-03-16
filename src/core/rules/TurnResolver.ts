import { Board } from "../board/Board";
import { BattleResolver } from "./BattleResolver";
import { HazardResolver } from "./HazardResolver";
import { MoveResolver } from "./MoveResolver";
import type { MoveIntent, MoveResult } from "./RuleTypes";

export class TurnResolver {
  constructor(
    private readonly moveResolver: MoveResolver = new MoveResolver(),
    private readonly battleResolver: BattleResolver = new BattleResolver(),
    private readonly hazardResolver: HazardResolver = new HazardResolver()
  ) {}

  resolve(board: Board, intent: MoveIntent): MoveResult {
    const moveResult = this.moveResolver.resolve(board, intent);
    if (!moveResult.success) {
      return moveResult;
    }

    const battles = this.battleResolver.resolve(board);
    this.battleResolver.apply(board, battles);
    const hazards = this.hazardResolver.resolve(board);
    this.hazardResolver.apply(board, hazards);

    return {
      ...moveResult,
      finalPositions: board.clonePositions(),
      triggeredBattles: battles,
      triggeredHazards: hazards
    };
  }
}
