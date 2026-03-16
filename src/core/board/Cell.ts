import type { TerrainType } from "../types/enums";

export interface CellData {
  terrainType: TerrainType;
  moveCost: number;
  blocksMove: boolean;
  blocksPush: boolean;
  effectId?: string;
}

export function createFloorCell(): CellData {
  return {
    terrainType: "floor",
    moveCost: 1,
    blocksMove: false,
    blocksPush: false
  };
}

export function createWallCell(): CellData {
  return {
    terrainType: "wall",
    moveCost: 999,
    blocksMove: true,
    blocksPush: true
  };
}

export function createHazardCell(effectId = "hazard"): CellData {
  return {
    terrainType: "hazard",
    moveCost: 1,
    blocksMove: false,
    blocksPush: false,
    effectId
  };
}
