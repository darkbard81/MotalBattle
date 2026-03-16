import { describe, expect, it } from "vitest";
import { EnemyAiResolver } from "../rules/EnemyAiResolver";
import { createBoard, createUnit, placeUnit, setHazard } from "./helpers";

describe("EnemyAiResolver", () => {
  it("targets the nearest ally when random is below 0.5", () => {
    const board = createBoard(6, 6);
    placeUnit(board, createUnit({ id: "enemy-1", team: "enemy", atk: 3, canBePushed: false }, 4, 4));
    placeUnit(board, createUnit({ id: "ally-near", team: "ally" }, 2, 4));
    placeUnit(board, createUnit({ id: "ally-far", team: "ally" }, 0, 0));

    const resolver = new EnemyAiResolver(() => 0.2);
    const result = resolver.resolve(board);

    expect(result.actions[0]?.strategy).toBe("nearest");
    expect(result.actions[0]?.targetId).toBe("ally-near");
  });

  it("targets the lowest defense ally when random is 0.5 or above", () => {
    const board = createBoard(6, 6);
    placeUnit(board, createUnit({ id: "enemy-1", team: "enemy", atk: 3, canBePushed: false }, 4, 4));
    placeUnit(board, createUnit({ id: "ally-low-def", team: "ally", def: 0 }, 1, 1));
    placeUnit(board, createUnit({ id: "ally-high-def", team: "ally", def: 3 }, 3, 4));

    const resolver = new EnemyAiResolver(() => 0.8);
    const result = resolver.resolve(board);

    expect(result.actions[0]?.strategy).toBe("lowest-defense");
    expect(result.actions[0]?.targetId).toBe("ally-low-def");
  });

  it("performs a single attack when the chosen target is adjacent", () => {
    const board = createBoard(5, 5);
    placeUnit(board, createUnit({ id: "enemy-1", team: "enemy", atk: 4, canBePushed: false }, 2, 2));
    placeUnit(board, createUnit({ id: "ally-1", team: "ally", hp: 10, maxHp: 10, def: 1 }, 3, 2));

    const resolver = new EnemyAiResolver(() => 0.2);
    const result = resolver.resolve(board);

    expect(result.triggeredBattles).toHaveLength(1);
    expect(result.triggeredBattles[0]?.pattern).toBe("single-attack");
    expect(board.getUnit("ally-1")?.hp).toBe(7);
  });

  it("moves one step toward the chosen target and attacks if it becomes adjacent", () => {
    const board = createBoard(6, 6);
    placeUnit(board, createUnit({ id: "enemy-1", team: "enemy", atk: 4, canBePushed: false }, 4, 2));
    placeUnit(board, createUnit({ id: "ally-1", team: "ally", hp: 10, maxHp: 10, def: 1 }, 2, 2));

    const resolver = new EnemyAiResolver(() => 0.2);
    const result = resolver.resolve(board);

    expect(result.actions[0]?.movedFrom).toEqual({ x: 4, y: 2 });
    expect(result.actions[0]?.movedTo).toEqual({ x: 3, y: 2 });
    expect(board.getUnit("enemy-1")?.gridPos).toEqual({ x: 3, y: 2 });
    expect(board.getUnit("ally-1")?.hp).toBe(7);
  });

  it("applies hazard damage after enemy actions", () => {
    const board = createBoard(6, 6);
    setHazard(board, 3, 2);
    placeUnit(board, createUnit({ id: "enemy-1", team: "enemy", hp: 20, maxHp: 20, canBePushed: false }, 4, 2));
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 2, 2));

    const resolver = new EnemyAiResolver(() => 0.2);
    const result = resolver.resolve(board);

    expect(result.triggeredHazards).toHaveLength(1);
    expect(result.triggeredHazards[0]?.unitId).toBe("enemy-1");
    expect(board.getUnit("enemy-1")?.hp).toBe(10);
  });
});
