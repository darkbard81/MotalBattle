import { describe, expect, it } from "vitest";
import { MoveResolver } from "../rules/MoveResolver";
import { createBoard, createMoveIntent, createUnit, placeUnit, setHazard, setWall } from "./helpers";

describe("MoveResolver with push chain", () => {
  it("pushes a single blocking unit", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1" }, 1, 1));
    placeUnit(board, createUnit({ id: "ally-2" }, 2, 1));

    const resolver = new MoveResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-1", 1, 1, [[2, 1]])
    );

    expect(result.success).toBe(true);
    expect(board.getUnitAt(2, 1)?.id).toBe("ally-1");
    expect(board.getUnitAt(3, 1)?.id).toBe("ally-2");
  });

  it("pushes a full chain when the end cell is empty", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1" }, 1, 1));
    placeUnit(board, createUnit({ id: "ally-2" }, 2, 1));
    placeUnit(board, createUnit({ id: "ally-3" }, 3, 1));

    const resolver = new MoveResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-1", 1, 1, [[2, 1]])
    );

    expect(result.success).toBe(true);
    expect(board.getUnitAt(2, 1)?.id).toBe("ally-1");
    expect(board.getUnitAt(3, 1)?.id).toBe("ally-2");
    expect(board.getUnitAt(4, 1)?.id).toBe("ally-3");
  });

  it("fails when the push chain is blocked by a wall", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1" }, 1, 1));
    placeUnit(board, createUnit({ id: "ally-2" }, 2, 1));
    setWall(board, 3, 1);

    const resolver = new MoveResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-1", 1, 1, [[2, 1]])
    );

    expect(result.success).toBe(false);
    expect(result.failedReason).toBe("BLOCKED_BY_TERRAIN");
    expect(board.getUnitAt(1, 1)?.id).toBe("ally-1");
    expect(board.getUnitAt(2, 1)?.id).toBe("ally-2");
  });

  it("fails when the blocking unit cannot be pushed", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1" }, 1, 1));
    placeUnit(board, createUnit({ id: "stone", canBePushed: false }, 2, 1));

    const resolver = new MoveResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-1", 1, 1, [[2, 1]])
    );

    expect(result.success).toBe(false);
    expect(result.failedReason).toBe("IMMOVABLE_UNIT");
    expect(board.getUnitAt(1, 1)?.id).toBe("ally-1");
    expect(board.getUnitAt(2, 1)?.id).toBe("stone");
  });

  it("fails when the blocking unit is an enemy", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));
    placeUnit(board, createUnit({ id: "enemy-1", team: "enemy" }, 2, 1));

    const resolver = new MoveResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-1", 1, 1, [[2, 1]])
    );

    expect(result.success).toBe(false);
    expect(result.failedReason).toBe("BLOCKED_BY_ENEMY");
    expect(board.getUnitAt(1, 1)?.id).toBe("ally-1");
    expect(board.getUnitAt(2, 1)?.id).toBe("enemy-1");
  });

  it("allows moving onto a hazard tile", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1" }, 1, 1));
    setHazard(board, 2, 1);

    const resolver = new MoveResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-1", 1, 1, [[2, 1]])
    );

    expect(result.success).toBe(true);
    expect(board.getUnitAt(2, 1)?.id).toBe("ally-1");
    expect(board.getCell(2, 1)?.terrainType).toBe("hazard");
  });

  it("fails when the moving unit is stunned", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1" }, 1, 1, { stunned: true }));

    const resolver = new MoveResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-1", 1, 1, [[2, 1]])
    );

    expect(result.success).toBe(false);
    expect(result.failedReason).toBe("UNIT_STUNNED");
    expect(board.getUnitAt(1, 1)?.id).toBe("ally-1");
  });

  it("fails when the moving unit has already acted", () => {
    const board = createBoard();
    placeUnit(board, createUnit({ id: "ally-1" }, 1, 1, { hasActed: true }));

    const resolver = new MoveResolver();
    const result = resolver.resolve(
      board,
      createMoveIntent("ally-1", 1, 1, [[2, 1]])
    );

    expect(result.success).toBe(false);
    expect(result.failedReason).toBe("UNIT_ALREADY_ACTED");
    expect(board.getUnitAt(1, 1)?.id).toBe("ally-1");
  });
});
