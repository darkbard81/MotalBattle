export type AnimationType = "assist" | "swap" | "block" | "flash" | "hit" | "die" | "noop";

export interface AnimationPolicy {
  durationMs: number;
  priority: number;
  blocksBoardInput: boolean;
}

// Phase C-2 1차 정책: 입력 체감 저하를 줄이기 위해 swap/flash/block은 비잠금 처리.
export const ANIMATION_POLICY: Record<AnimationType, AnimationPolicy> = {
  die: {
    durationMs: 220,
    priority: 100,
    blocksBoardInput: true
  },
  assist: {
    durationMs: 1000,
    priority: 80,
    blocksBoardInput: true
  },
  hit: {
    durationMs: 180,
    priority: 70,
    blocksBoardInput: true
  },
  swap: {
    durationMs: 180,
    priority: 40,
    blocksBoardInput: false
  },
  flash: {
    durationMs: 120,
    priority: 30,
    blocksBoardInput: false
  },
  block: {
    durationMs: 100,
    priority: 20,
    blocksBoardInput: false
  },
  noop: {
    durationMs: 0,
    priority: 0,
    blocksBoardInput: false
  }
};
