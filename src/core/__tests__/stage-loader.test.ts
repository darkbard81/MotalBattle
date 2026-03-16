import { describe, expect, it } from "vitest";
import { createBoardFromStageData, type StageData, type UnitCatalog } from "../data/StageLoader";

describe("StageLoader", () => {
  it("creates a board from stage and unit data", () => {
    const stage: StageData = {
      id: "test-stage",
      width: 3,
      height: 3,
      terrain: [
        ["floor", "hazard", "floor"],
        ["floor", "wall", "floor"],
        ["floor", "floor", "floor"]
      ],
      units: [{ unitId: "ally-1", x: 0, y: 0 }]
    };

    const unitCatalog: UnitCatalog = {
      "ally-1": {
        id: "ally-1",
        name: "Ally",
        sprite_path: "src/data/assets/TestUnit.png",
        team: "ally",
        hp: 10,
        maxHp: 10,
        atk: 3,
        def: 1,
        weight: 1,
        canBePushed: true
      }
    };

    const board = createBoardFromStageData(stage, unitCatalog);

    expect(board.width).toBe(3);
    expect(board.height).toBe(3);
    expect(board.getCell(1, 0)?.terrainType).toBe("hazard");
    expect(board.getCell(1, 1)?.terrainType).toBe("wall");
    expect(board.getUnitAt(0, 0)?.id).toBe("ally-1");
  });
});
