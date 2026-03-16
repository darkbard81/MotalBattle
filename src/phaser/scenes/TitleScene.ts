import Phaser from "phaser";
import { getAvailableScenarioDefinitions } from "../../core/debug/debugScenario";
import { GAME_HEIGHT, GAME_WIDTH } from "../../game/constants";
import { UIScene } from "./UIScene";

export class TitleScene extends Phaser.Scene {
  static readonly KEY = "TitleScene";
  private selectedScenarioIndex = 0;
  private scenarioLabels: Phaser.GameObjects.Text[] = [];
  private readonly scenarios = Object.values(getAvailableScenarioDefinitions());

  constructor() {
    super(TitleScene.KEY);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#171c2b");
    this.selectedScenarioIndex = 0;
    this.scenarioLabels = [];

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 48, "Motal Battle", {
      color: "#f8fafc",
      fontFamily: "monospace",
      fontSize: "40px"
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 2, "Select Scenario", {
      color: "#a5f3fc",
      fontFamily: "monospace",
      fontSize: "18px"
    }).setOrigin(0.5);

    this.renderScenarioList();

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 112, "UP/DOWN to select, SPACE/ENTER to start", {
      color: "#94a3b8",
      fontFamily: "monospace",
      fontSize: "14px"
    }).setOrigin(0.5);

    this.input.keyboard?.on("keydown-UP", () => {
      this.moveSelection(-1);
    });
    this.input.keyboard?.on("keydown-DOWN", () => {
      this.moveSelection(1);
    });
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.startSelectedScenario();
    });
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.startSelectedScenario();
    });
  }

  private renderScenarioList(): void {
    for (const label of this.scenarioLabels) {
      label.destroy();
    }

    this.scenarioLabels = this.scenarios.map((scenario, index) => {
      const isSelected = index === this.selectedScenarioIndex;
      return this.add.text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 42 + index * 28,
        `${isSelected ? "> " : "  "}${scenario.scenario.title}`,
        {
          color: isSelected ? "#f8fafc" : "#94a3b8",
          fontFamily: "monospace",
          fontSize: "16px"
        }
      ).setOrigin(0.5);
    });
  }

  private moveSelection(delta: number): void {
    if (this.scenarios.length === 0) {
      return;
    }

    this.selectedScenarioIndex =
      (this.selectedScenarioIndex + delta + this.scenarios.length) % this.scenarios.length;
    this.renderScenarioList();
  }

  private startSelectedScenario(): void {
    const scenario = this.scenarios[this.selectedScenarioIndex];
    if (!scenario) {
      return;
    }

    this.scene.start("GameScene", {
      scenarioId: scenario.scenario.id
    });
    if (this.scene.isActive(UIScene.KEY)) {
      this.scene.stop(UIScene.KEY);
    }
    this.scene.launch(UIScene.KEY);
  }
}
