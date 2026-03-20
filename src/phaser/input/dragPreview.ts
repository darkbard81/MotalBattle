import type { Vec2 } from "../../core/types/common";

export function isPointerOnBlockedCell(targetCell: Vec2 | null, blockedCell: Vec2 | null): boolean {
  if (!targetCell || !blockedCell) {
    return false;
  }

  return targetCell.x === blockedCell.x && targetCell.y === blockedCell.y;
}

export function getBlockedPreviewWorld(
  pointerWorld: Vec2,
  activeWorld: Vec2,
  blockedDirection: Vec2,
  tileSize: number
): Vec2 {
  const blockedOffset = Math.min(tileSize / 2, Math.max(tileSize * 0.35, 18));

  if (blockedDirection.x !== 0) {
    return {
      x: activeWorld.x + blockedDirection.x * blockedOffset,
      y: pointerWorld.y
    };
  }

  if (blockedDirection.y !== 0) {
    return {
      x: pointerWorld.x,
      y: activeWorld.y + blockedDirection.y * blockedOffset
    };
  }

  return pointerWorld;
}
