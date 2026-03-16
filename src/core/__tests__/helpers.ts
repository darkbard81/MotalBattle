import { Board } from "../board/Board";
import { createHazardCell, createWallCell } from "../board/Cell";
import type { MoveIntent } from "../rules/RuleTypes";
import { Unit, type UnitData } from "../unit/Unit";
import type { UnitState } from "../unit/UnitState";

const DEFAULT_UNIT_DATA: UnitData = {
  id: "unit",
  name: "Unit",
  sprite_path: "src/data/assets/TestUnit.png",
  team: "ally",
  hp: 10,
  maxHp: 10,
  atk: 3,
  def: 1,
  weight: 1,
  canBePushed: true
};

export function createBoard(width = 8, height = 8): Board {
  return new Board(width, height);
}

export function createUnit(
  overrides: Partial<UnitData> = {},
  x = 0,
  y = 0,
  state?: Partial<UnitState>
): Unit {
  return new Unit(
    {
      ...DEFAULT_UNIT_DATA,
      ...overrides,
      id: overrides.id ?? DEFAULT_UNIT_DATA.id
    },
    { x, y },
    state
  );
}

export function placeUnit(board: Board, unit: Unit): Unit {
  board.placeUnit(unit, unit.gridPos.x, unit.gridPos.y);
  return unit;
}

export function createMoveIntent(
  unitId: string,
  startX: number,
  startY: number,
  path: Array<[number, number]>
): MoveIntent {
  const mappedPath = path.map(([x, y]) => ({ x, y }));
  const finalTarget = mappedPath[mappedPath.length - 1] ?? { x: startX, y: startY };

  return {
    unitId,
    start: { x: startX, y: startY },
    path: mappedPath,
    finalTarget
  };
}

export function setWall(board: Board, x: number, y: number): void {
  board.terrain[y][x] = createWallCell();
}

export function setHazard(board: Board, x: number, y: number, effectId?: string): void {
  board.terrain[y][x] = createHazardCell(effectId);
}
