export interface UnitState {
  hasActed: boolean;
  hasMoved: boolean;
  stunned: boolean;
  selected: boolean;
}

export function createDefaultUnitState(): UnitState {
  return {
    hasActed: false,
    hasMoved: false,
    stunned: false,
    selected: false
  };
}
