import { describe, expect, it } from "vitest";
import { DragInteractionResolver } from "../rules/DragInteractionResolver";
import { createBoard, createUnit, placeUnit, setWall } from "./helpers";

describe("DragInteractionResolver", () => {
  it("moves into an empty tile during drag", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));

    const resolver = new DragInteractionResolver();
    const result = resolver.step(board, "ally-1", { x: 2, y: 1 });

    expect(result.kind).toBe("move");
    expect(board.getUnitAt(2, 1)?.id).toBe("ally-1");
  });

  it("swaps with an ally tile during drag", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));
    placeUnit(board, createUnit({ id: "ally-2", team: "ally" }, 2, 1));

    const resolver = new DragInteractionResolver();
    const result = resolver.step(board, "ally-1", { x: 2, y: 1 });

    expect(result.kind).toBe("swap");
    expect(board.getUnitAt(2, 1)?.id).toBe("ally-1");
    expect(board.getUnitAt(1, 1)?.id).toBe("ally-2");
  });

  it("blocks on an enemy tile during drag", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));
    placeUnit(board, createUnit({ id: "enemy-1", team: "enemy" }, 2, 1));

    const resolver = new DragInteractionResolver();
    const result = resolver.step(board, "ally-1", { x: 2, y: 1 });

    expect(result.kind).toBe("block");
    expect(result.reason).toBe("BLOCKED_BY_ENEMY");
    expect(board.getUnitAt(1, 1)?.id).toBe("ally-1");
  });

  it("blocks on a wall tile during drag", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));
    setWall(board, 2, 1);

    const resolver = new DragInteractionResolver();
    const result = resolver.step(board, "ally-1", { x: 2, y: 1 });

    expect(result.kind).toBe("block");
    expect(result.reason).toBe("BLOCKED_BY_TERRAIN");
    expect(board.getUnitAt(1, 1)?.id).toBe("ally-1");
  });

  it("blocks drag interaction when the unit is stunned", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1, { stunned: true }));

    const resolver = new DragInteractionResolver();
    const result = resolver.step(board, "ally-1", { x: 2, y: 1 });

    expect(result.kind).toBe("block");
    expect(result.reason).toBe("UNIT_STUNNED");
    expect(board.getUnitAt(1, 1)?.id).toBe("ally-1");
  });
});
