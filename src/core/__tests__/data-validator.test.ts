import { describe, expect, it } from "vitest";
import reachCellStageData from "../../data/maps/stage-reach-cell.json";
import {
  validateDialogData,
  validateScenarioData,
  validateStageData
} from "../data/DataValidator";

describe("DataValidator", () => {
  it("formats stage schema failures with a readable missing-field path", () => {
    expect(() =>
      validateStageData(
        {
          id: "stage-1",
          width: 2,
          height: 2,
          terrain: [["floor", "floor"], ["floor", "floor"]]
        },
        "inline stage"
      )
    ).toThrowError("Invalid stage in inline stage:\n- /units is required.");
  });

  it("reports missing scenario branch targets clearly", () => {
    expect(() =>
      validateScenarioData(
        {
          id: "scenario-1",
          title: "Scenario 1",
          startingStepId: "intro",
          steps: [
            {
              id: "intro",
              type: "dialogue",
              title: "Intro",
              nextStepId: "battle",
              lines: ["hello"]
            },
            {
              id: "battle",
              type: "stage",
              title: "Battle",
              stageId: "stage-1",
              onSuccess: "missing-step"
            }
          ]
        },
        "inline scenario"
      )
    ).toThrowError(
      "Invalid scenario references in inline scenario:\n- /steps/1/onSuccess references missing step \"missing-step\"."
    );
  });

  it("accepts a reach_cell objective stage payload", () => {
    const stage = validateStageData(
      {
        id: "reach-stage",
        width: 3,
        height: 3,
        terrain: [
          ["floor", "floor", "floor"],
          ["floor", "floor", "floor"],
          ["floor", "floor", "floor"]
        ],
        units: [],
        objectives: [
          {
            type: "reach_cell",
            x: 2,
            y: 1,
            team: "ally"
          }
        ]
      },
      "reach stage"
    );

    expect(stage.objectives?.[0]).toEqual({
      type: "reach_cell",
      x: 2,
      y: 1,
      team: "ally"
    });
  });

  it("validates the reach_cell sample stage json", () => {
    const stage = validateStageData(
      reachCellStageData,
      "src/data/maps/stage-reach-cell.json"
    );

    expect(stage.id).toBe("stage-reach-cell");
    expect(stage.objectives).toEqual([
      {
        type: "reach_cell",
        x: 4,
        y: 4,
        team: "ally"
      }
    ]);
  });

  it("validates dialog payloads with the shared schema path", () => {
    const dialog = validateDialogData(
      {
        id: "dialog-1",
        title: "Dialog 1",
        steps: [
          {
            background: "bg.webp",
            msg_type: "narration",
            message: "hello"
          }
        ]
      },
      "inline dialog"
    );

    expect(dialog.id).toBe("dialog-1");
  });
});
