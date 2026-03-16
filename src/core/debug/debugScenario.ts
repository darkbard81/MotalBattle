import scenarioData from "../../data/scenarios/debug-scenario.json";
import dialog01Data from "../../data/maps/dialog-01.json";
import stage01Data from "../../data/maps/stage-01.json";
import stage02Data from "../../data/maps/stage-02.json";
import unitCatalog from "../../data/units/debug-units.json";
import type { ScenarioDefinition, ScenarioData } from "../data/ScenarioLoader";
import type { StageData } from "../data/StageLoader";
import type { UnitCatalog } from "../data/StageLoader";
import type { DialogData } from "../data/DialogLoader";

export function getDebugScenarioDefinition(): ScenarioDefinition {
  return {
    scenario: scenarioData as ScenarioData,
    stages: {
      "stage-01": stage01Data as StageData,
      "stage-02": stage02Data as StageData
    },
    dialogs: {
      "dialog-01": dialog01Data as DialogData
    }
  };
}

export function getDebugUnitCatalog(): UnitCatalog {
  const { $schema: _schema, ...catalog } = unitCatalog;
  return catalog as UnitCatalog;
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
