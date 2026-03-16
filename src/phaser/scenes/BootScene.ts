import Phaser from "phaser";
import { DEFAULT_UI_STATE } from "../../game/uiState";

export class BootScene extends Phaser.Scene {
  static readonly KEY = "BootScene";

  constructor() {
    super(BootScene.KEY);
  }

  create(): void {
    this.registry.set("bootedAt", Date.now());
    for (const [key, value] of Object.entries(DEFAULT_UI_STATE)) {
      this.registry.set(key, value);
    }
    this.scene.start("PreloadScene");
  }
}
