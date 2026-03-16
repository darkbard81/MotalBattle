export type Team = "ally" | "enemy" | "neutral";

export type TerrainType = "floor" | "wall" | "hazard";

export type MoveFailureReason =
  | "UNIT_NOT_FOUND"
  | "UNIT_DEAD"
  | "UNIT_STUNNED"
  | "UNIT_ALREADY_ACTED"
  | "INVALID_START"
  | "EMPTY_PATH"
  | "OUT_OF_BOUNDS"
  | "NON_CARDINAL_STEP"
  | "STEP_TOO_LONG"
  | "BLOCKED_BY_TERRAIN"
  | "BLOCKED_BY_ENEMY"
  | "IMMOVABLE_UNIT"
  | "PUSH_CHAIN_BLOCKED";
