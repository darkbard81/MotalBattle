import { describe, expect, it } from "vitest";
import { createBoard, createUnit, placeUnit } from "./helpers";

describe("Board", () => {
  it("places and moves a unit", () => {
    const board = createBoard();
    const unit = placeUnit(board, createUnit({ id: "ally-1" }, 1, 1));

    board.moveUnit(unit.id, 2, 1);

    expect(board.getUnitAt(2, 1)?.id).toBe("ally-1");
    expect(board.getUnitAt(1, 1)).toBeNull();
  });

  it("removes a unit and clears the cell", () => {
    const board = createBoard();
    const unit = placeUnit(board, createUnit({ id: "ally-1" }, 1, 1));

    board.removeUnit(unit.id);

    expect(board.getUnit(unit.id)).toBeNull();
    expect(board.getUnitAt(1, 1)).toBeNull();
  });

  it("rejects placement outside bounds", () => {
    const board = createBoard();
    const unit = createUnit({ id: "ally-1" }, 9, 9);

    expect(() => board.placeUnit(unit, 9, 9)).toThrow("out of bounds");
  });
});
