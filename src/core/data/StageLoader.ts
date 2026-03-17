import { Board } from "../board/Board";
import {
  createFloorCell,
  createHazardCell,
  createWallCell,
  type CellData
} from "../board/Cell";
import type { StageObjective } from "../rules/ObjectiveManager";
import { createUnit } from "../unit/UnitFactory";
import type { UnitData } from "../unit/Unit";
import type { TerrainType } from "../types/enums";

export interface StageUnitPlacement {
  unitId: string;
  x: number;
  y: number;
}

export interface StageData {
  id: string;
  title?: string;
  description?: string;
  objective?: string;
  objectives?: StageObjective[];
  turnLimit?: number;
  background_path?: string;
  image_area?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  width: number;
  height: number;
  terrain: TerrainType[][];
  units: StageUnitPlacement[];
}

export type UnitCatalog = Record<string, UnitData>;

function createCellFromTerrainType(terrainType: TerrainType): CellData {
  if (terrainType === "wall") {
    return createWallCell();
  }

  if (terrainType === "hazard") {
    return createHazardCell();
  }

  return createFloorCell();
}

export function createBoardFromStageData(stage: StageData, unitCatalog: UnitCatalog): Board {
  const terrain = stage.terrain.map((row) =>
    row.map((terrainType) => createCellFromTerrainType(terrainType))
  );
  const board = new Board(stage.width, stage.height, terrain);

  for (const placement of stage.units) {
    const unitData = unitCatalog[placement.unitId];
    if (!unitData) {
      throw new Error(`createBoardFromStageData: missing unit data for ${placement.unitId}`);
    }

    const unit = createUnit(unitData, { x: placement.x, y: placement.y });
    board.placeUnit(unit, placement.x, placement.y);
  }

  return board;
}
