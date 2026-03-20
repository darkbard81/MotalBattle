import stageData from "../../data/maps/debug-battle.json";
import unitCatalog from "../../data/units/debug-units.json";
import {
  createBoardFromStageData,
  type UnitCatalog
} from "../data/StageLoader";
import { validateStageData, validateUnitCatalogData } from "../data/DataValidator";

export function getDebugBattleDefinition(): {
  stage: ReturnType<typeof validateStageData>;
  unitCatalog: UnitCatalog;
} {
  return {
    stage: validateStageData(stageData, "src/data/maps/debug-battle.json"),
    unitCatalog: validateUnitCatalogData(unitCatalog, "src/data/units/debug-units.json")
  };
}

export function createDebugBattle() {
  const { stage, unitCatalog } = getDebugBattleDefinition();
  return createBoardFromStageData(stage, unitCatalog);
}
