import { describe, expect, it } from "vitest";
import { createBoard, createUnit, placeUnit, setWall } from "../../core/__tests__/helpers";
import {
  getBlockedPreviewWorld,
  getDiagonalSwapCandidate,
  getFloatingPreviewWorld,
  getNextFloatingCell,
  getRawPointerCell,
  shouldReleaseBlockedAxis
} from "./dragPreview";

describe("getRawPointerCell", () => {
  it("tracks pointer cells even outside the board bounds", () => {
    expect(getRawPointerCell({ x: 319, y: 191 }, { originX: 64, originY: 64, tileSize: 64 })).toEqual({
      x: 3,
      y: 1
    });
    expect(getRawPointerCell({ x: 20, y: 20 }, { originX: 64, originY: 64, tileSize: 64 })).toEqual({
      x: -1,
      y: -1
    });
  });
});

describe("shouldReleaseBlockedAxis", () => {
  it("keeps a positive x-axis block until the pointer crosses back over the blocked edge", () => {
    const lock = { axis: "x" as const, direction: 1 as const, blockedCell: { x: 2, y: 1 } };
    const config = { originX: 0, originY: 0, tileSize: 128 };

    expect(shouldReleaseBlockedAxis({ x: 300, y: 180 }, lock, config)).toBe(false);
    expect(shouldReleaseBlockedAxis({ x: 255, y: 180 }, lock, config)).toBe(true);
  });
});

describe("getNextFloatingCell", () => {
  it("advances one orthogonal tile at a time toward the pointer intent", () => {
    const nextCell = getNextFloatingCell(
      { x: 420, y: 180 },
      { x: 1, y: 1 },
      { x: 160, y: 160 },
      { originX: 64, originY: 64, tileSize: 64 }
    );

    expect(nextCell).toEqual({ x: 2, y: 1 });
  });

  it("ignores the blocked axis and keeps the free axis moving", () => {
    const nextCell = getNextFloatingCell(
      { x: 420, y: 260 },
      { x: 1, y: 1 },
      { x: 160, y: 160 },
      { originX: 64, originY: 64, tileSize: 64 },
      { axis: "x", direction: 1, blockedCell: { x: 2, y: 1 } }
    );

    expect(nextCell).toEqual({ x: 1, y: 2 });
  });
});

describe("getFloatingPreviewWorld", () => {
  it("clamps the floating preview to the active cell when the pointer is far away", () => {
    const preview = getFloatingPreviewWorld({ x: 420, y: 20 }, { x: 256, y: 256 }, 128);

    expect(preview).toEqual({ x: 320, y: 192 });
  });

  it("keeps a horizontal block offset while following free-axis movement", () => {
    const preview = getFloatingPreviewWorld(
      { x: 340, y: 520 },
      { x: 256, y: 256 },
      128,
      { axis: "x", direction: 1, blockedCell: { x: 2, y: 1 } }
    );

    expect(preview).toEqual({ x: 300.8, y: 320 });
  });
});

describe("getBlockedPreviewWorld", () => {
  it("keeps backward compatibility for blocked preview helpers", () => {
    expect(getBlockedPreviewWorld({ x: 420, y: 120 }, { x: 256, y: 256 }, { x: 0, y: -1 }, 128)).toEqual({
      x: 320,
      y: 211.2
    });
  });
});

describe("getDiagonalSwapCandidate", () => {
  it("allows a diagonal swap once the pointer clearly leans into the target diagonal tile", () => {
    const board = createBoard(4, 4);
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));
    placeUnit(board, createUnit({ id: "ally-2", team: "ally" }, 2, 2));

    const candidate = getDiagonalSwapCandidate(
      board,
      { x: 1, y: 1 },
      { x: 160, y: 160 },
      { x: 182, y: 182 },
      64
    );

    expect(candidate).toEqual({ x: 2, y: 2 });
  });

  it("does not open diagonal swap for shallow diagonal drift", () => {
    const board = createBoard(4, 4);
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));
    placeUnit(board, createUnit({ id: "ally-2", team: "ally" }, 2, 2));

    const candidate = getDiagonalSwapCandidate(
      board,
      { x: 1, y: 1 },
      { x: 160, y: 160 },
      { x: 170, y: 170 },
      64
    );

    expect(candidate).toBeNull();
  });

  it("still prefers orthogonal intent when one axis dominates too strongly", () => {
    const board = createBoard(4, 4);
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));
    placeUnit(board, createUnit({ id: "ally-2", team: "ally" }, 2, 2));

    const candidate = getDiagonalSwapCandidate(
      board,
      { x: 1, y: 1 },
      { x: 160, y: 160 },
      { x: 220, y: 172 },
      64
    );

    expect(candidate).toBeNull();
  });

  it("blocks rough diagonal swap when both orthogonal gates are closed by terrain or enemies", () => {
    const board = createBoard(4, 4);
    placeUnit(board, createUnit({ id: "ally-1", team: "ally" }, 1, 1));
    placeUnit(board, createUnit({ id: "ally-2", team: "ally" }, 2, 2));
    placeUnit(board, createUnit({ id: "enemy-1", team: "enemy" }, 2, 1));
    setWall(board, 1, 2);

    const candidate = getDiagonalSwapCandidate(
      board,
      { x: 1, y: 1 },
      { x: 160, y: 160 },
      { x: 196, y: 196 },
      64
    );

    expect(candidate).toBeNull();
  });
});
