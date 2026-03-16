import type { Vec2 } from "../types/common";
import type { Team } from "../types/enums";
import { createDefaultUnitState, type UnitState } from "./UnitState";

export interface UnitData {
  id: string;
  name: string;
  sprite_path: string;
  image_area?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  team: Team;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  weight: number;
  canBePushed: boolean;
}

export class Unit {
  readonly id: string;
  readonly name: string;
  readonly sprite_path: string;
  readonly image_area?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  readonly team: Team;
  hp: number;
  readonly maxHp: number;
  readonly atk: number;
  readonly def: number;
  readonly weight: number;
  readonly canBePushed: boolean;
  gridPos: Vec2;
  state: UnitState;

  constructor(data: UnitData, pos: Vec2, state?: Partial<UnitState>) {
    this.id = data.id;
    this.name = data.name;
    this.sprite_path = data.sprite_path;
    this.image_area = data.image_area;
    this.team = data.team;
    this.hp = data.hp;
    this.maxHp = data.maxHp;
    this.atk = data.atk;
    this.def = data.def;
    this.weight = data.weight;
    this.canBePushed = data.canBePushed;
    this.gridPos = { ...pos };
    this.state = {
      ...createDefaultUnitState(),
      ...state
    };
  }

  applyDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  isAlive(): boolean {
    return this.hp > 0;
  }
}
