import { describe, expect, it } from "vitest";
import { getBlockedPreviewWorld, isPointerOnBlockedCell } from "./dragPreview";

describe("isPointerOnBlockedCell", () => {
  it("returns true while the pointer stays on the blocked tile", () => {
    expect(isPointerOnBlockedCell({ x: 2, y: 1 }, { x: 2, y: 1 })).toBe(true);
  });

  it("returns false after the pointer leaves the blocked tile", () => {
    expect(isPointerOnBlockedCell({ x: 2, y: 0 }, { x: 2, y: 1 })).toBe(false);
    expect(isPointerOnBlockedCell(null, { x: 2, y: 1 })).toBe(false);
  });
});

describe("getBlockedPreviewWorld", () => {
  it("keeps a horizontal block offset while following vertical pointer movement", () => {
    const preview = getBlockedPreviewWorld(
      { x: 340, y: 520 },
      { x: 256, y: 256 },
      { x: 1, y: 0 },
      128
    );

    expect(preview).toEqual({ x: 300.8, y: 520 });
  });

  it("keeps a vertical block offset while following horizontal pointer movement", () => {
    const preview = getBlockedPreviewWorld(
      { x: 420, y: 120 },
      { x: 256, y: 256 },
      { x: 0, y: -1 },
      128
    );

    expect(preview).toEqual({ x: 420, y: 211.2 });
  });

  it("returns the pointer world when no blocked direction exists", () => {
    const pointerWorld = { x: 111, y: 222 };

    expect(getBlockedPreviewWorld(pointerWorld, { x: 256, y: 256 }, { x: 0, y: 0 }, 128)).toEqual(
      pointerWorld
    );
  });
});
