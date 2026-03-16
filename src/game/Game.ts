import Phaser from "phaser";
import { gameConfig } from "./config";

let game: Phaser.Game | null = null;

export function createGame(parent?: string): Phaser.Game {
  if (game) {
    return game;
  }

  game = new Phaser.Game({
    ...gameConfig,
    parent: parent ?? gameConfig.parent
  });

  return game;
}
