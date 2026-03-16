import Phaser from "phaser";
import { getDebugScenarioDefinition, getDebugUnitCatalog } from "../../core/debug/debugScenario";
import { assetPathToUrl, getStageBackgroundTextureKey, getUnitTextureKey } from "../../game/assets";
import { GAME_HEIGHT, GAME_WIDTH } from "../../game/constants";

export class PreloadScene extends Phaser.Scene {
  static readonly KEY = "PreloadScene";

  constructor() {
    super(PreloadScene.KEY);
  }

  preload(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const scenarioDefinition = getDebugScenarioDefinition();
    const unitCatalog = getDebugUnitCatalog();

    this.add.text(centerX, centerY - 16, "Loading", {
      color: "#f4f4f5",
      fontFamily: "monospace",
      fontSize: "24px"
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 20, "Step 1 foundation", {
      color: "#7dd3fc",
      fontFamily: "monospace",
      fontSize: "14px"
    }).setOrigin(0.5);

    for (const stage of Object.values(scenarioDefinition.stages)) {
      if (!stage.background_path) {
        continue;
      }

      const textureKey = getStageBackgroundTextureKey(stage.id);
      if (!this.textures.exists(textureKey)) {
        this.load.image(textureKey, assetPathToUrl(stage.background_path));
      }
    }

    for (const unit of Object.values(unitCatalog)) {
      const textureKey = getUnitTextureKey(unit.id);
      if (!this.textures.exists(textureKey)) {
        this.load.image(textureKey, assetPathToUrl(unit.sprite_path));
      }
    }
  }

  create(): void {
    this.scene.start("TitleScene");
  }
}
