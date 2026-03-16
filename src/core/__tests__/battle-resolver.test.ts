import { describe, expect, it } from "vitest";
import { BattleResolver } from "../rules/BattleResolver";
import { createBoard, createUnit, placeUnit } from "./helpers";

describe("BattleResolver", () => {
  it("detects horizontal sandwich attacks", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-left", team: "ally" }, 1, 1));
    placeUnit(board, createUnit({ id: "enemy-mid", team: "enemy" }, 2, 1));
    placeUnit(board, createUnit({ id: "ally-right", team: "ally" }, 3, 1));

    const resolver = new BattleResolver();
    const events = resolver.resolve(board);

    expect(events).toHaveLength(1);
    expect(events[0]?.targetId).toBe("enemy-mid");
    expect(events[0]?.pattern).toBe("sandwich-horizontal");
    expect(events[0]?.damage).toBe(6);
  });

  it("detects vertical sandwich attacks", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-top", team: "ally" }, 2, 1));
    placeUnit(board, createUnit({ id: "enemy-mid", team: "enemy" }, 2, 2));
    placeUnit(board, createUnit({ id: "ally-bottom", team: "ally" }, 2, 3));

    const resolver = new BattleResolver();
    const events = resolver.resolve(board);

    expect(events).toHaveLength(1);
    expect(events[0]?.pattern).toBe("sandwich-vertical");
  });

  it("does not trigger when both sides are not allies", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "enemy-left", team: "enemy" }, 1, 1));
    placeUnit(board, createUnit({ id: "enemy-mid", team: "enemy" }, 2, 1));
    placeUnit(board, createUnit({ id: "ally-right", team: "ally" }, 3, 1));

    const resolver = new BattleResolver();
    const events = resolver.resolve(board);

    expect(events).toHaveLength(0);
  });

  it("uses combined attacker damage and removes dead targets", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-left", team: "ally", atk: 4 }, 1, 1));
    placeUnit(board, createUnit({ id: "enemy-mid", team: "enemy", hp: 5, maxHp: 5, def: 1 }, 2, 1));
    placeUnit(board, createUnit({ id: "ally-right", team: "ally", atk: 4 }, 3, 1));

    const resolver = new BattleResolver();
    const events = resolver.resolve(board);
    const defeated = resolver.apply(board, events);

    expect(defeated).toEqual(["enemy-mid"]);
    expect(board.getUnit("enemy-mid")).toBeNull();
    expect(board.getUnitAt(2, 1)).toBeNull();
  });

  it("uses the sum of both ally attack values before defense", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-left", team: "ally", atk: 2 }, 1, 1));
    placeUnit(board, createUnit({ id: "enemy-mid", team: "enemy", hp: 10, maxHp: 10, def: 2 }, 2, 1));
    placeUnit(board, createUnit({ id: "ally-right", team: "ally", atk: 5 }, 3, 1));

    const resolver = new BattleResolver();
    const events = resolver.resolve(board);
    resolver.apply(board, events);

    expect(events[0]?.damage).toBe(7);
    expect(board.getUnit("enemy-mid")?.hp).toBe(5);
  });
});
