import { describe, expect, it } from "vitest";
import { HazardResolver } from "../rules/HazardResolver";
import { createBoard, createUnit, placeUnit, setHazard } from "./helpers";

describe("HazardResolver", () => {
  it("creates a fixed-damage hazard event for a unit on a hazard tile", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", hp: 20, maxHp: 20 }, 2, 2));
    setHazard(board, 2, 2, "lava");

    const resolver = new HazardResolver();
    const events = resolver.resolve(board);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      unitId: "ally-1",
      damage: 10,
      effectId: "lava"
    });
  });

  it("applies fixed damage and removes dead units", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", hp: 10, maxHp: 10 }, 2, 2));
    setHazard(board, 2, 2);

    const resolver = new HazardResolver();
    const events = resolver.resolve(board);
    const defeated = resolver.apply(board, events);

    expect(defeated).toEqual(["ally-1"]);
    expect(board.getUnit("ally-1")).toBeNull();
  });
});
