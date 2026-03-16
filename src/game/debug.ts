import { DEBUG_ON } from "./constants";

export function debugLog(message: string, payload?: unknown): void {
  if (!DEBUG_ON) {
    return;
  }

  if (payload === undefined) {
    console.log(`[debug] ${message}`);
    return;
  }

  console.log(`[debug] ${message}`, payload);
}

export function debugEvent(scope: string, action: string, payload?: unknown): void {
  debugLog(`${scope}:${action}`, payload);
}

export function debugDragStart(payload: {
  unitId: string;
  startCell: { x: number; y: number };
  durationMs: number;
}): void {
  debugEvent("drag", "start", payload);
}

export function debugDragStep(payload: {
  unitId: string;
  targetCell: { x: number; y: number };
  result: string;
  reason?: string;
  swappedUnitId?: string;
}): void {
  debugEvent("drag", "step", payload);
}

export function debugBattleResult(payload: {
  eventCount: number;
  hitTargetIds: string[];
  defeatedUnitIds: string[];
  positions: Record<string, { x: number; y: number }>;
}): void {
  debugEvent("battle", "resolve", payload);
}

export function debugSceneInit(payload: {
  debugOn: boolean;
  unitCount: number;
  units: Array<{
    id: string;
    team: string;
    hp: number;
    position: { x: number; y: number };
  }>;
}): void {
  debugEvent("scene", "init", payload);
}

export function debugEnemyTurn(payload: {
  actionCount: number;
  actions: Array<{
    enemyId: string;
    targetId?: string;
    strategy?: string;
    movedTo?: { x: number; y: number };
    attacked?: boolean;
  }>;
  defeatedUnitIds: string[];
}): void {
  debugEvent("enemy", "turn", payload);
}
