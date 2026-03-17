import type { Vec2 } from "../types/common";
import type { MoveFailureReason } from "../types/enums";
import type { HazardEvent } from "./HazardResolver";
import type { ObjectiveStatus } from "./ObjectiveManager";

export interface MoveIntent {
  unitId: string;
  start: Vec2;
  path: Vec2[];
  finalTarget: Vec2;
}

export interface BattleEvent {
  attackerIds: string[];
  targetId: string;
  targetPosition: Vec2;
  damage: number;
  pattern: "sandwich-horizontal" | "sandwich-vertical" | "single-attack";
}

export interface MoveResult {
  success: boolean;
  movedUnitIds: string[];
  finalPositions: Record<string, Vec2>;
  triggeredBattles: BattleEvent[];
  triggeredHazards: HazardEvent[];
  failedReason?: MoveFailureReason;
}

export interface TurnResolutionState {
  status: ObjectiveStatus;
  currentTurn: number;
}

export interface TurnResult extends MoveResult {
  objectiveState: TurnResolutionState;
}

export interface PushResult {
  success: boolean;
  movedUnitIds: string[];
  failedReason?: Extract<
    MoveFailureReason,
    | "OUT_OF_BOUNDS"
    | "BLOCKED_BY_TERRAIN"
    | "BLOCKED_BY_ENEMY"
    | "IMMOVABLE_UNIT"
    | "PUSH_CHAIN_BLOCKED"
  >;
}
