import { Board } from "../board/Board";
import type { Vec2 } from "../types/common";
import gameConfigData from "../../data/config.json";

export interface HazardEvent {
  unitId: string;
  position: Vec2;
  damage: number;
  effectId?: string;
}

export class HazardResolver {
  resolve(board: Board): HazardEvent[] {
    const events: HazardEvent[] = [];

    for (const unit of board.getAllUnits()) {
      const cell = board.getCell(unit.gridPos.x, unit.gridPos.y);
      if (!cell || cell.terrainType !== "hazard") {
        continue;
      }

      events.push({
        unitId: unit.id,
        position: { ...unit.gridPos },
        damage: gameConfigData.hazardDamage,
        effectId: cell.effectId
      });
    }

    return events;
  }

  apply(board: Board, events: HazardEvent[]): string[] {
    const defeatedUnitIds: string[] = [];

    for (const event of events) {
      const unit = board.getUnit(event.unitId);
      if (!unit || !unit.isAlive()) {
        continue;
      }

      unit.applyDamage(event.damage);
      if (!unit.isAlive()) {
        defeatedUnitIds.push(unit.id);
      }
    }

    for (const unitId of defeatedUnitIds) {
      board.removeUnit(unitId);
    }

    return defeatedUnitIds;
  }
}
