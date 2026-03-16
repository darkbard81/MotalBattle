import { describe, expect, it } from "vitest";
import {
  getDialogForScenarioStep,
  getNextScenarioStep,
  getStageForScenarioStep,
  getStartingStep,
  type ScenarioDefinition
} from "../data/ScenarioLoader";

describe("ScenarioLoader", () => {
  const definition: ScenarioDefinition = {
    scenario: {
      id: "scenario-1",
      title: "Scenario 1",
      startingStepId: "dialogue-1",
      steps: [
        {
          id: "dialogue-1",
          type: "dialogue",
          title: "Intro",
          dialogId: "dialog-1",
          nextStepId: "stage-1"
        },
        {
          id: "stage-1",
          type: "stage",
          title: "Stage One",
          stageId: "stage-01"
        }
      ]
    },
    stages: {
      "stage-01": {
        id: "stage-01",
        width: 2,
        height: 2,
        terrain: [
          ["floor", "floor"],
          ["floor", "floor"]
        ],
        units: []
      }
    },
    dialogs: {
      "dialog-1": {
        id: "dialog-1",
        title: "Dialog 1",
        steps: [
          {
            background: "src/data/assets/BG_Village01.png",
            msg_type: "나레이션",
            message: "hello"
          }
        ]
      }
    }
  };

  it("returns the configured starting step", () => {
    const step = getStartingStep(definition.scenario);
    expect(step.id).toBe("dialogue-1");
  });

  it("returns the next step from nextStepId", () => {
    const step = getNextScenarioStep(definition.scenario, "dialogue-1");
    expect(step?.id).toBe("stage-1");
  });

  it("resolves the stage data for a stage step", () => {
    const step = definition.scenario.steps[1];
    const stage = getStageForScenarioStep(definition, step);
    expect(stage?.id).toBe("stage-01");
  });

  it("resolves the dialog data for a dialogue step", () => {
    const step = definition.scenario.steps[0];
    const dialog = getDialogForScenarioStep(definition, step);
    expect(dialog?.id).toBe("dialog-1");
  });
});
