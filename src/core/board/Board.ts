import type { Unit } from "../unit/Unit";
import type { Vec2 } from "../types/common";
import { createFloorCell, type CellData } from "./Cell";

export class Board {
  readonly width: number;
  readonly height: number;
  readonly cells: (string | null)[][];
  readonly terrain: CellData[][];
  readonly units: Map<string, Unit>;

  constructor(width: number, height: number, terrain?: CellData[][]) {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null)
    );
    this.terrain = terrain ?? Array.from({ length: height }, () =>
      Array.from({ length: width }, () => createFloorCell())
    );
    this.units = new Map();
  }

  isInside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getCell(x: number, y: number): CellData | null {
    if (!this.isInside(x, y)) {
      return null;
    }

    return this.terrain[y][x];
  }

  isBlockedForMove(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    return cell === null || cell.blocksMove;
  }

  isBlockedForPush(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    return cell === null || cell.blocksPush;
  }

  isEmpty(x: number, y: number): boolean {
    return this.isInside(x, y) && this.cells[y][x] === null;
  }

  getUnit(unitId: string): Unit | null {
    return this.units.get(unitId) ?? null;
  }

  getUnitAt(x: number, y: number): Unit | null {
    if (!this.isInside(x, y)) {
      return null;
    }

    const unitId = this.cells[y][x];
    return unitId ? this.getUnit(unitId) : null;
  }

  placeUnit(unit: Unit, x: number, y: number): void {
    if (!this.isInside(x, y)) {
      throw new Error("placeUnit: out of bounds");
    }

    if (this.isBlockedForMove(x, y) || !this.isEmpty(x, y)) {
      throw new Error("placeUnit: target cell unavailable");
    }

    unit.gridPos = { x, y };
    this.units.set(unit.id, unit);
    this.cells[y][x] = unit.id;
  }

  removeUnit(unitId: string): void {
    const unit = this.units.get(unitId);
    if (!unit) {
      return;
    }

    const { x, y } = unit.gridPos;
    if (this.isInside(x, y) && this.cells[y][x] === unitId) {
      this.cells[y][x] = null;
    }

    this.units.delete(unitId);
  }

  moveUnit(unitId: string, targetX: number, targetY: number): void {
    const unit = this.units.get(unitId);
    if (!unit) {
      throw new Error("moveUnit: unit not found");
    }

    if (!this.isInside(targetX, targetY)) {
      throw new Error("moveUnit: out of bounds");
    }

    if (this.isBlockedForMove(targetX, targetY) || !this.isEmpty(targetX, targetY)) {
      throw new Error("moveUnit: target cell unavailable");
    }

    const { x, y } = unit.gridPos;
    this.cells[y][x] = null;
    this.cells[targetY][targetX] = unitId;
    unit.gridPos = { x: targetX, y: targetY };
  }

  swapUnits(firstUnitId: string, secondUnitId: string): void {
    const firstUnit = this.units.get(firstUnitId);
    const secondUnit = this.units.get(secondUnitId);

    if (!firstUnit || !secondUnit) {
      throw new Error("swapUnits: unit not found");
    }

    const firstPos = { ...firstUnit.gridPos };
    const secondPos = { ...secondUnit.gridPos };

    this.cells[firstPos.y][firstPos.x] = secondUnitId;
    this.cells[secondPos.y][secondPos.x] = firstUnitId;
    firstUnit.gridPos = secondPos;
    secondUnit.gridPos = firstPos;
  }

  getAllUnits(): Unit[] {
    return Array.from(this.units.values());
  }

  clonePositions(): Record<string, Vec2> {
    return this.getAllUnits().reduce<Record<string, Vec2>>((accumulator, unit) => {
      accumulator[unit.id] = { ...unit.gridPos };
      return accumulator;
    }, {});
  }
}
