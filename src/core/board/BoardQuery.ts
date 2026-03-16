import type { Vec2 } from "../types/common";
import { Board } from "./Board";

export class BoardQuery {
  constructor(private readonly board: Board) {}

  getOrthogonalNeighbors(pos: Vec2): Vec2[] {
    const candidates: Vec2[] = [
      { x: pos.x - 1, y: pos.y },
      { x: pos.x + 1, y: pos.y },
      { x: pos.x, y: pos.y - 1 },
      { x: pos.x, y: pos.y + 1 }
    ];

    return candidates.filter((candidate) => this.board.isInside(candidate.x, candidate.y));
  }

  isOccupied(pos: Vec2): boolean {
    return this.board.getUnitAt(pos.x, pos.y) !== null;
  }
}
