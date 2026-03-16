export interface Vec2 {
  x: number;
  y: number;
}

export function isSameVec2(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

export function addVec2(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  };
}

export function subtractVec2(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}
