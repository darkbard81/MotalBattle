import stageData from "../../data/maps/debug-battle.json";
import unitCatalog from "../../data/units/debug-units.json";
import {
  createBoardFromStageData,
  type StageData,
  type UnitCatalog
} from "../data/StageLoader";

export function getDebugBattleDefinition(): {
  stage: StageData;
  unitCatalog: UnitCatalog;
} {
  const { $schema: _schema, ...catalog } = unitCatalog;

  return {
    stage: stageData as StageData,
    unitCatalog: catalog as UnitCatalog
  };
}

export function createDebugBattle() {
  const { stage, unitCatalog } = getDebugBattleDefinition();
  return createBoardFromStageData(stage, unitCatalog);
}
