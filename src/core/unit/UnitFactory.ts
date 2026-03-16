import type { Vec2 } from "../types/common";
import { Unit, type UnitData } from "./Unit";

export function createUnit(data: UnitData, pos: Vec2): Unit {
  return new Unit(data, pos);
}
