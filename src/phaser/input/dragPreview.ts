import type { Board } from "../../core/board/Board";
import type { Vec2 } from "../../core/types/common";

export interface BlockedAxisLock {
  axis: "x" | "y";
  direction: -1 | 1;
  blockedCell: Vec2;
}

export function getDiagonalSwapCandidate(
  board: Board,
  activeCell: Vec2,
  activeWorld: Vec2,
  pointerWorld: Vec2,
  tileSize: number,
  blockedAxisLock: BlockedAxisLock | null = null
): Vec2 | null {
  if (blockedAxisLock) {
    return null;
  }

  const offsetX = pointerWorld.x - activeWorld.x;
  const offsetY = pointerWorld.y - activeWorld.y;
  const minDiagonalIntent = tileSize * 0.12;
  if (Math.abs(offsetX) < minDiagonalIntent || Math.abs(offsetY) < minDiagonalIntent) {
    return null;
  }

  const dominantAxis = Math.max(Math.abs(offsetX), Math.abs(offsetY));
  const minorAxis = Math.min(Math.abs(offsetX), Math.abs(offsetY));
  if (dominantAxis <= 0 || minorAxis / dominantAxis < 0.45) {
    return null;
  }

  const candidate = {
    x: activeCell.x + Math.sign(offsetX),
    y: activeCell.y + Math.sign(offsetY)
  };
  const deltaX = candidate.x - activeCell.x;
  const deltaY = candidate.y - activeCell.y;
  if (Math.abs(deltaX) !== 1 || Math.abs(deltaY) !== 1) {
    return null;
  }

  if (!board.isInside(candidate.x, candidate.y) || board.isBlockedForMove(candidate.x, candidate.y)) {
    return null;
  }

  const occupant = board.getUnitAt(candidate.x, candidate.y);
  if (!occupant || occupant.team !== "ally") {
    return null;
  }

  const horizontalGate = {
    x: candidate.x,
    y: activeCell.y
  };
  const verticalGate = {
    x: activeCell.x,
    y: candidate.y
  };

  if (!isDiagonalSwapGateOpen(board, horizontalGate) && !isDiagonalSwapGateOpen(board, verticalGate)) {
    return null;
  }

  return candidate;
}

export function getRawPointerCell(
  pointerWorld: Vec2,
  config: {
    originX: number;
    originY: number;
    tileSize: number;
  }
): Vec2 {
  return {
    x: Math.floor((pointerWorld.x - config.originX) / config.tileSize),
    y: Math.floor((pointerWorld.y - config.originY) / config.tileSize)
  };
}

export function shouldReleaseBlockedAxis(
  pointerWorld: Vec2,
  blockedAxisLock: BlockedAxisLock,
  config: {
    originX: number;
    originY: number;
    tileSize: number;
  }
): boolean {
  const blockedMinX = config.originX + blockedAxisLock.blockedCell.x * config.tileSize;
  const blockedMinY = config.originY + blockedAxisLock.blockedCell.y * config.tileSize;
  const blockedMaxX = blockedMinX + config.tileSize;
  const blockedMaxY = blockedMinY + config.tileSize;

  if (blockedAxisLock.axis === "x") {
    return blockedAxisLock.direction > 0
      ? pointerWorld.x < blockedMinX
      : pointerWorld.x > blockedMaxX;
  }

  return blockedAxisLock.direction > 0
    ? pointerWorld.y < blockedMinY
    : pointerWorld.y > blockedMaxY;
}

export function getFloatingPreviewWorld(
  pointerWorld: Vec2,
  activeWorld: Vec2,
  tileSize: number,
  blockedAxisLock: BlockedAxisLock | null = null
): Vec2 {
  const halfTile = tileSize / 2;
  const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
  const minX = activeWorld.x - halfTile;
  const maxX = activeWorld.x + halfTile;
  const minY = activeWorld.y - halfTile;
  const maxY = activeWorld.y + halfTile;
  const blockedOffset = Math.min(halfTile, Math.max(tileSize * 0.35, 18));

  if (!blockedAxisLock) {
    return {
      x: clamp(pointerWorld.x, minX, maxX),
      y: clamp(pointerWorld.y, minY, maxY)
    };
  }

  if (blockedAxisLock.axis === "x") {
    return {
      x: activeWorld.x + blockedAxisLock.direction * blockedOffset,
      y: clamp(pointerWorld.y, minY, maxY)
    };
  }

  return {
    x: clamp(pointerWorld.x, minX, maxX),
    y: activeWorld.y + blockedAxisLock.direction * blockedOffset
  };
}

export function getNextFloatingCell(
  pointerWorld: Vec2,
  activeCell: Vec2,
  activeWorld: Vec2,
  config: {
    originX: number;
    originY: number;
    tileSize: number;
  },
  blockedAxisLock: BlockedAxisLock | null = null
): Vec2 | null {
  const rawPointerCell = getRawPointerCell(pointerWorld, config);
  let deltaX = rawPointerCell.x - activeCell.x;
  let deltaY = rawPointerCell.y - activeCell.y;

  if (blockedAxisLock?.axis === "x") {
    deltaX = 0;
  }

  if (blockedAxisLock?.axis === "y") {
    deltaY = 0;
  }

  if (deltaX === 0 && deltaY === 0) {
    return null;
  }

  if (deltaX === 0) {
    return {
      x: activeCell.x,
      y: activeCell.y + Math.sign(deltaY)
    };
  }

  if (deltaY === 0) {
    return {
      x: activeCell.x + Math.sign(deltaX),
      y: activeCell.y
    };
  }

  const worldDeltaX = Math.abs(pointerWorld.x - activeWorld.x);
  const worldDeltaY = Math.abs(pointerWorld.y - activeWorld.y);

  if (worldDeltaX >= worldDeltaY) {
    return {
      x: activeCell.x + Math.sign(deltaX),
      y: activeCell.y
    };
  }

  return {
    x: activeCell.x,
    y: activeCell.y + Math.sign(deltaY)
  };
}

export function getBlockedPreviewWorld(
  pointerWorld: Vec2,
  activeWorld: Vec2,
  blockedDirection: Vec2,
  tileSize: number
): Vec2 {
  const blockedAxisLock =
    blockedDirection.x !== 0
      ? {
          axis: "x" as const,
          direction: blockedDirection.x > 0 ? (1 as const) : (-1 as const),
          blockedCell: { x: 0, y: 0 }
        }
      : blockedDirection.y !== 0
        ? {
            axis: "y" as const,
            direction: blockedDirection.y > 0 ? (1 as const) : (-1 as const),
            blockedCell: { x: 0, y: 0 }
          }
        : null;

  return getFloatingPreviewWorld(pointerWorld, activeWorld, tileSize, blockedAxisLock);
}

function isDiagonalSwapGateOpen(board: Board, gate: Vec2): boolean {
  if (!board.isInside(gate.x, gate.y) || board.isBlockedForMove(gate.x, gate.y)) {
    return false;
  }

  const occupant = board.getUnitAt(gate.x, gate.y);
  return occupant === null || occupant.team === "ally";
}
