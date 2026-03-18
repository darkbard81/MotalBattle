import { describe, expect, it } from "vitest";
import { ObjectiveManager } from "../rules/ObjectiveManager";
import { createBoard, createUnit, placeUnit } from "./helpers";

describe("ObjectiveManager", () => {
  it("returns success for defeat_all when no enemies are alive", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));

    const manager = new ObjectiveManager();
    const status = manager.evaluate([{ type: "defeat_all" }], {
      board,
      currentTurn: 0
    });

    expect(status).toBe("success");
  });

  it("returns success for survive_n_turns when currentTurn reaches limit", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "enemy-1", team: "enemy" }, 3, 3));

    const manager = new ObjectiveManager();
    const status = manager.evaluate([{ type: "survive_n_turns", turn: 5 }], {
      board,
      currentTurn: 5
    });

    expect(status).toBe("success");
  });

  it("prioritizes fail when success and fail states coexist", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "enemy-1", team: "enemy" }, 3, 3));

    const manager = new ObjectiveManager();
    const status = manager.evaluate(
      [
        { type: "defeat_all" },
        { type: "survive_n_turns" }
      ],
      {
        board,
        currentTurn: 5
      }
    );

    expect(status).toBe("fail");
  });

  it("returns immediate success for survive_n_turns when turn is zero", () => {
    const board = createBoard();

    const manager = new ObjectiveManager();
    const status = manager.evaluate([{ type: "survive_n_turns", turn: 0 }], {
      board,
      currentTurn: 0
    });

    expect(status).toBe("success");
  });

  it("returns success for reach_cell when the matching team occupies the target cell", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 2, 1));

    const manager = new ObjectiveManager();
    const status = manager.evaluate([{ type: "reach_cell", x: 2, y: 1, team: "ally" }], {
      board,
      currentTurn: 0
    });

    expect(status).toBe("success");
  });

  it("returns ongoing for protect_unit while the protected unit remains on the board", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));

    const manager = new ObjectiveManager();
    const status = manager.evaluate([{ type: "protect_unit", unitId: "ally-1" }], {
      board,
      currentTurn: 0
    });

    expect(status).toBe("ongoing");
  });

  it("returns fail for protect_unit when the protected unit is missing", () => {
    const board = createBoard();

    const manager = new ObjectiveManager();
    const status = manager.evaluate([{ type: "protect_unit", unitId: "ally-1" }], {
      board,
      currentTurn: 0
    });

    expect(status).toBe("fail");
  });

  it("prioritizes fail for protect_unit even when survive_n_turns succeeds", () => {
    const board = createBoard();

    const manager = new ObjectiveManager();
    const status = manager.evaluate(
      [
        { type: "protect_unit", unitId: "ally-1" },
        { type: "survive_n_turns", turn: 0 }
      ],
      {
        board,
        currentTurn: 0
      }
    );

    expect(status).toBe("fail");
  });
});
