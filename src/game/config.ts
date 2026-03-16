import Phaser from "phaser";
import { GAME_BACKGROUND, GAME_HEIGHT, GAME_WIDTH } from "./constants";
import { BootScene } from "../phaser/scenes/BootScene";
import { PreloadScene } from "../phaser/scenes/PreloadScene";
import { TitleScene } from "../phaser/scenes/TitleScene";
import { GameScene } from "../phaser/scenes/GameScene";
import { UIScene } from "../phaser/scenes/UIScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: GAME_BACKGROUND,
  scene: [BootScene, PreloadScene, TitleScene, GameScene, UIScene],
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
    powerPreference: "high-performance"
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
