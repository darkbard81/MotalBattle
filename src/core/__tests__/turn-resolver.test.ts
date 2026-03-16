import { describe, expect, it } from "vitest";
import { TurnResolver } from "../rules/TurnResolver";
import { createBoard, createMoveIntent, createUnit, placeUnit, setHazard } from "./helpers";

describe("TurnResolver", () => {
  it("moves first, then triggers battle resolution", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-left", team: "ally", atk: 4 }, 1, 1));
    placeUnit(board, createUnit({ id: "enemy-mid", team: "enemy", hp: 6, maxHp: 6, def: 1 }, 3, 1));
    placeUnit(board, createUnit({ id: "ally-right", team: "ally", atk: 4 }, 4, 1));

    const resolver = new TurnResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-left", 1, 1, [[2, 1]])
    );

    expect(result.success).toBe(true);
    expect(result.triggeredBattles).toHaveLength(1);
    expect(board.getUnit("enemy-mid")).toBeNull();
    expect(board.getUnitAt(2, 1)?.id).toBe("ally-left");
  });

  it("returns the move failure without resolving battle", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-left", team: "ally" }, 1, 1));

    const resolver = new TurnResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-left", 1, 1, [[3, 1]])
    );

    expect(result.success).toBe(false);
    expect(result.failedReason).toBe("NON_CARDINAL_STEP");
    expect(result.triggeredBattles).toHaveLength(0);
  });

  it("applies hazard damage after battle resolution", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-left", team: "ally", atk: 4, hp: 20, maxHp: 20 }, 1, 1));
    placeUnit(board, createUnit({ id: "enemy-mid", team: "enemy", hp: 12, maxHp: 12, def: 1 }, 3, 1));
    placeUnit(board, createUnit({ id: "ally-right", team: "ally", atk: 4 }, 4, 1));
    setHazard(board, 2, 1, "lava");

    const resolver = new TurnResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-left", 1, 1, [[2, 1]])
    );

    expect(result.success).toBe(true);
    expect(result.triggeredBattles).toHaveLength(1);
    expect(result.triggeredHazards).toHaveLength(1);
    expect(result.triggeredHazards[0]?.damage).toBe(10);
    expect(board.getUnit("ally-left")?.hp).toBe(10);
    expect(board.getUnit("enemy-mid")?.hp).toBe(5);
  });
});
