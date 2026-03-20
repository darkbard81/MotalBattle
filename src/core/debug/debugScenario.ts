import scenarioData from "../../data/scenarios/debug-scenario.json";
import dialog01Data from "../../data/maps/dialog-01.json";
import stage01Data from "../../data/maps/stage-01.json";
import stage02Data from "../../data/maps/stage-02.json";
import unitCatalog from "../../data/units/debug-units.json";
import {
  validateDialogData,
  validateScenarioData,
  validateStageData,
  validateUnitCatalogData
} from "../data/DataValidator";
import type { ScenarioDefinition } from "../data/ScenarioLoader";
import type { UnitCatalog } from "../data/StageLoader";

export function getDebugScenarioDefinition(): ScenarioDefinition {
  return {
    scenario: validateScenarioData(
      scenarioData,
      "src/data/scenarios/debug-scenario.json"
    ),
    stages: {
      "stage-01": validateStageData(stage01Data, "src/data/maps/stage-01.json"),
      "stage-02": validateStageData(stage02Data, "src/data/maps/stage-02.json")
    },
    dialogs: {
      "dialog-01": validateDialogData(dialog01Data, "src/data/maps/dialog-01.json")
    }
  };
}

export function getDebugUnitCatalog(): UnitCatalog {
  return validateUnitCatalogData(unitCatalog, "src/data/units/debug-units.json");
}

export function getAvailableScenarioDefinitions(): Record<string, ScenarioDefinition> {
  const debugScenario = getDebugScenarioDefinition();

  return {
    [debugScenario.scenario.id]: debugScenario
  };
}

export function getScenarioDefinitionById(scenarioId: string): ScenarioDefinition {
  const scenarios = getAvailableScenarioDefinitions();
  const scenario = scenarios[scenarioId];

  if (!scenario) {
    throw new Error(`getScenarioDefinitionById: missing scenario ${scenarioId}`);
  }

  return scenario;
}
