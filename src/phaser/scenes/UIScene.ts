import Phaser from "phaser";
import { assetPathToUrl } from "../../game/assets";
import { GAME_HEIGHT, GAME_WIDTH } from "../../game/constants";
import { DEFAULT_UI_STATE, UI_STATE_KEYS } from "../../game/uiState";

export class UIScene extends Phaser.Scene {
  static readonly KEY = "UIScene";
  static readonly FLOW_ACTION_EVENT = "ui:flow-action";
  static readonly UNIT_DETAIL_CLOSE_EVENT = "ui:unit-detail-close";
  private scenarioTitleText?: Phaser.GameObjects.Text;
  private stageTitleText?: Phaser.GameObjects.Text;
  private headerHintText?: Phaser.GameObjects.Text;
  private headerTimerText?: Phaser.GameObjects.Text;
  private selectedUnitText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private battleSummaryText?: Phaser.GameObjects.Text;
  private dialogueOverlay?: Phaser.GameObjects.Container;
  private dialogueBackground?: Phaser.GameObjects.Rectangle;
  private dialogueBgImage?: Phaser.GameObjects.Image;
  private dialogueStandingImage?: Phaser.GameObjects.Image;
  private dialogueTitleText?: Phaser.GameObjects.Text;
  private dialogueSpeakerText?: Phaser.GameObjects.Text;
  private dialogueMessageText?: Phaser.GameObjects.Text;
  private dialogueHintText?: Phaser.GameObjects.Text;
  private flowOverlay?: Phaser.GameObjects.Container;
  private flowTitleText?: Phaser.GameObjects.Text;
  private flowMessageText?: Phaser.GameObjects.Text;
  private flowPrimaryButton?: Phaser.GameObjects.Container;
  private flowSecondaryButton?: Phaser.GameObjects.Container;
  private flowTertiaryButton?: Phaser.GameObjects.Container;
  private unitDetailOverlay?: Phaser.GameObjects.Container;
  private unitDetailTitleText?: Phaser.GameObjects.Text;
  private unitDetailBodyText?: Phaser.GameObjects.Text;
  private unitDetailHintText?: Phaser.GameObjects.Text;

  constructor() {
    super(UIScene.KEY);
  }

  create(): void {
    const boardPixelSize = 8 * 56;
    const originX = (GAME_WIDTH - boardPixelSize) / 2;
    const headerY = 180 - 92;
    const centerX = GAME_WIDTH / 2;

    const headerBackground = this.add.rectangle(
      centerX,
      headerY,
      boardPixelSize,
      52,
      0x0f172a,
      0.92
    );
    headerBackground.setStrokeStyle(2, 0x334155, 1);
    headerBackground.setScrollFactor(0);

    this.add.text(centerX, headerY - 10, "Motal Battle UI", {
      color: "#e2e8f0",
      fontFamily: "monospace",
      fontSize: "18px"
    }).setOrigin(0.5).setScrollFactor(0);

    this.scenarioTitleText = this.add.text(originX + 16, headerY - 30, DEFAULT_UI_STATE[UI_STATE_KEYS.scenarioTitle], {
      color: "#f8fafc",
      fontFamily: "monospace",
      fontSize: "12px"
    }).setScrollFactor(0);

    this.stageTitleText = this.add.text(originX + 16, headerY - 14, DEFAULT_UI_STATE[UI_STATE_KEYS.stageTitle], {
      color: "#cbd5e1",
      fontFamily: "monospace",
      fontSize: "12px"
    }).setScrollFactor(0);

    this.headerHintText = this.add.text(originX + 16, headerY + 10, DEFAULT_UI_STATE[UI_STATE_KEYS.headerHint], {
      color: "#67e8f9",
      fontFamily: "monospace",
      fontSize: "13px"
    }).setScrollFactor(0);

    this.headerTimerText = this.add.text(
      originX + boardPixelSize - 16,
      headerY + 10,
      DEFAULT_UI_STATE[UI_STATE_KEYS.headerTimer],
      {
        color: "#f8fafc",
        fontFamily: "monospace",
        fontSize: "16px"
      }
    ).setOrigin(1, 0).setScrollFactor(0);

    this.selectedUnitText = this.add.text(originX, headerY + 68, "Selected: -", {
      color: "#cbd5e1",
      fontFamily: "monospace",
      fontSize: "14px"
    }).setScrollFactor(0);

    this.statusText = this.add.text(originX, 640, DEFAULT_UI_STATE[UI_STATE_KEYS.statusMessage], {
      color: "#cbd5e1",
      fontFamily: "monospace",
      fontSize: "14px"
    }).setScrollFactor(0);

    this.battleSummaryText = this.add.text(originX, 662, DEFAULT_UI_STATE[UI_STATE_KEYS.battleSummary], {
      color: "#94a3b8",
      fontFamily: "monospace",
      fontSize: "13px"
    }).setScrollFactor(0);

    this.createDialogueOverlay();
    this.createFlowOverlay();
    this.createUnitDetailOverlay();

    this.registry.events.on(`changedata-${UI_STATE_KEYS.flowPanelVisible}`, this.handleFlowPanelVisible, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.flowPanelTitle}`, this.handleFlowPanelTitle, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.flowPanelMessage}`, this.handleFlowPanelMessage, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.flowPanelPrimaryLabel}`, this.handleFlowPanelPrimaryLabel, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.flowPanelSecondaryLabel}`, this.handleFlowPanelSecondaryLabel, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.flowPanelTertiaryLabel}`, this.handleFlowPanelTertiaryLabel, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.dialogueVisible}`, this.handleDialogueVisible, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.dialogueTitle}`, this.handleDialogueTitle, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.dialogueSpeaker}`, this.handleDialogueSpeaker, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.dialogueMessage}`, this.handleDialogueMessage, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.dialogueHint}`, this.handleDialogueHint, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.dialogueBackgroundPath}`, this.handleDialogueBackgroundPath, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.dialogueStandingPath}`, this.handleDialogueStandingPath, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.scenarioTitle}`, this.handleScenarioTitle, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.stageTitle}`, this.handleStageTitle, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.headerHint}`, this.handleHeaderHint, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.headerTimer}`, this.handleHeaderTimer, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.statusMessage}`, this.handleStatusMessage, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.battleSummary}`, this.handleBattleSummary, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.selectedUnitId}`, this.handleSelectedUnit, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.unitDetailVisible}`, this.handleUnitDetailVisible, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.unitDetailTitle}`, this.handleUnitDetailTitle, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.unitDetailBody}`, this.handleUnitDetailBody, this);
    this.registry.events.on(`changedata-${UI_STATE_KEYS.unitDetailHint}`, this.handleUnitDetailHint, this);

    this.handleFlowPanelVisible(this.registry, this.registry.get(UI_STATE_KEYS.flowPanelVisible));
    this.handleFlowPanelTitle(this.registry, this.registry.get(UI_STATE_KEYS.flowPanelTitle));
    this.handleFlowPanelMessage(this.registry, this.registry.get(UI_STATE_KEYS.flowPanelMessage));
    this.handleFlowPanelPrimaryLabel(this.registry, this.registry.get(UI_STATE_KEYS.flowPanelPrimaryLabel));
    this.handleFlowPanelSecondaryLabel(this.registry, this.registry.get(UI_STATE_KEYS.flowPanelSecondaryLabel));
    this.handleFlowPanelTertiaryLabel(this.registry, this.registry.get(UI_STATE_KEYS.flowPanelTertiaryLabel));
    this.handleDialogueVisible(this.registry, this.registry.get(UI_STATE_KEYS.dialogueVisible));
    this.handleDialogueTitle(this.registry, this.registry.get(UI_STATE_KEYS.dialogueTitle));
    this.handleDialogueSpeaker(this.registry, this.registry.get(UI_STATE_KEYS.dialogueSpeaker));
    this.handleDialogueMessage(this.registry, this.registry.get(UI_STATE_KEYS.dialogueMessage));
    this.handleDialogueHint(this.registry, this.registry.get(UI_STATE_KEYS.dialogueHint));
    this.handleDialogueBackgroundPath(this.registry, this.registry.get(UI_STATE_KEYS.dialogueBackgroundPath));
    this.handleDialogueStandingPath(this.registry, this.registry.get(UI_STATE_KEYS.dialogueStandingPath));
    this.handleScenarioTitle(this.registry, this.registry.get(UI_STATE_KEYS.scenarioTitle));
    this.handleStageTitle(this.registry, this.registry.get(UI_STATE_KEYS.stageTitle));
    this.handleHeaderHint(this.registry, this.registry.get(UI_STATE_KEYS.headerHint));
    this.handleHeaderTimer(this.registry, this.registry.get(UI_STATE_KEYS.headerTimer));
    this.handleStatusMessage(this.registry, this.registry.get(UI_STATE_KEYS.statusMessage));
    this.handleBattleSummary(this.registry, this.registry.get(UI_STATE_KEYS.battleSummary));
    this.handleSelectedUnit(this.registry, this.registry.get(UI_STATE_KEYS.selectedUnitId));
    this.handleUnitDetailVisible(this.registry, this.registry.get(UI_STATE_KEYS.unitDetailVisible));
    this.handleUnitDetailTitle(this.registry, this.registry.get(UI_STATE_KEYS.unitDetailTitle));
    this.handleUnitDetailBody(this.registry, this.registry.get(UI_STATE_KEYS.unitDetailBody));
    this.handleUnitDetailHint(this.registry, this.registry.get(UI_STATE_KEYS.unitDetailHint));
  }

  private createDialogueOverlay(): void {
    this.dialogueOverlay = this.add.container(0, 0).setDepth(1000).setVisible(false).setScrollFactor(0);
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const panelWidth = 980;
    const panelHeight = 180;
    const panelX = centerX - panelWidth / 2;
    const panelY = GAME_HEIGHT - 120;

    this.dialogueBackground = this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x020617, 0.76);
    this.dialogueBgImage = this.add.image(centerX, centerY, "__WHITE");
    this.dialogueBgImage.setVisible(false);

    const panel = this.add.rectangle(centerX, panelY, panelWidth, panelHeight, 0x0f172a, 0.95);
    panel.setStrokeStyle(2, 0x334155, 1);

    this.dialogueStandingImage = this.add.image(panelX, centerY + 30, "__WHITE");
    this.dialogueStandingImage.setVisible(false);

    this.dialogueTitleText = this.add.text(panelX + 12 , panelY - 82, "", {
      color: "#67e8f9",
      fontFamily: "monospace",
      fontSize: "14px"
    });

    this.dialogueSpeakerText = this.add.text(panelX + 12, panelY - 58, "", {
      color: "#f8fafc",
      fontFamily: "monospace",
      fontSize: "18px"
    });

    this.dialogueMessageText = this.add.text(panelX + 12, panelY - 28, "", {
      color: "#e2e8f0",
      fontFamily: "monospace",
      fontSize: "16px",
      wordWrap: { width: 720 }
    });

    this.dialogueHintText = this.add.text(
      centerX + panelWidth / 2 - 20,
      panelY + 50,
      DEFAULT_UI_STATE[UI_STATE_KEYS.dialogueHint],
      {
        color: "#94a3b8",
        fontFamily: "monospace",
        fontSize: "12px"
      }
    ).setOrigin(1, 0);

    this.dialogueOverlay.add([
      this.dialogueBackground,
      this.dialogueBgImage,
      this.dialogueStandingImage,
      panel,
      this.dialogueTitleText,
      this.dialogueSpeakerText,
      this.dialogueMessageText,
      this.dialogueHintText
    ]);
  }

  private createFlowOverlay(): void {
    this.flowOverlay = this.add.container(0, 0).setDepth(1100).setVisible(false).setScrollFactor(0);
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const backdrop = this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x020617, 0.62);
    const panel = this.add.rectangle(centerX, centerY, 520, 260, 0x111827, 0.96);
    panel.setStrokeStyle(2, 0x334155, 1);

    this.flowTitleText = this.add.text(centerX, centerY - 70, "", {
      color: "#f8fafc",
      fontFamily: "monospace",
      fontSize: "22px"
    }).setOrigin(0.5);

    this.flowMessageText = this.add.text(centerX, centerY - 22, "", {
      color: "#cbd5e1",
      fontFamily: "monospace",
      fontSize: "14px",
      align: "center",
      wordWrap: { width: 420 }
    }).setOrigin(0.5, 0);

    this.flowPrimaryButton = this.createFlowButton(centerX, centerY + 60, "primary");
    this.flowSecondaryButton = this.createFlowButton(centerX, centerY + 108, "secondary");
    this.flowTertiaryButton = this.createFlowButton(centerX, centerY + 156, "tertiary");

    this.flowOverlay.add([
      backdrop,
      panel,
      this.flowTitleText,
      this.flowMessageText,
      this.flowPrimaryButton,
      this.flowSecondaryButton,
      this.flowTertiaryButton
    ]);
  }

  private createUnitDetailOverlay(): void {
    this.unitDetailOverlay = this.add.container(0, 0).setDepth(1050).setVisible(false).setScrollFactor(0);
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const backdrop = this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x020617, 0.72);
    backdrop.setInteractive({ useHandCursor: true });
    backdrop.on("pointerdown", () => {
      this.game.events.emit(UIScene.UNIT_DETAIL_CLOSE_EVENT);
    });

    const panel = this.add.rectangle(centerX, centerY, 540, 380, 0x111827, 0.98);
    panel.setStrokeStyle(2, 0x475569, 1);

    this.unitDetailTitleText = this.add.text(centerX - 230, centerY - 150, "", {
      color: "#f8fafc",
      fontFamily: "monospace",
      fontSize: "24px"
    });

    this.unitDetailBodyText = this.add.text(centerX - 230, centerY - 102, "", {
      color: "#cbd5e1",
      fontFamily: "monospace",
      fontSize: "18px",
      lineSpacing: 10,
      wordWrap: { width: 460 }
    });

    this.unitDetailHintText = this.add.text(centerX + 230, centerY + 150, "", {
      color: "#94a3b8",
      fontFamily: "monospace",
      fontSize: "13px"
    }).setOrigin(1, 1);

    this.unitDetailOverlay.add([
      backdrop,
      panel,
      this.unitDetailTitleText,
      this.unitDetailBodyText,
      this.unitDetailHintText
    ]);
  }

  private createFlowButton(
    x: number,
    y: number,
    action: "primary" | "secondary" | "tertiary"
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 260, 34, 0x1e293b, 0.96);
    bg.setStrokeStyle(1, 0x475569, 1);
    bg.setInteractive({ useHandCursor: true });
    const label = this.add.text(0, 0, "", {
      color: "#f8fafc",
      fontFamily: "monospace",
      fontSize: "14px"
    }).setOrigin(0.5);

    bg.on("pointerdown", () => {
      this.game.events.emit(UIScene.FLOW_ACTION_EVENT, action);
    });
    bg.on("pointerover", () => {
      bg.setFillStyle(0x334155, 1);
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(0x1e293b, 0.96);
    });

    container.add([bg, label]);
    container.setData("label", label);
    container.setVisible(false);
    return container;
  }

  private handleFlowPanelVisible(_parent: unknown, value: boolean): void {
    this.flowOverlay?.setVisible(!!value);
  }

  private handleFlowPanelTitle(_parent: unknown, value: string): void {
    this.flowTitleText?.setText(value ?? "");
  }

  private handleFlowPanelMessage(_parent: unknown, value: string): void {
    this.flowMessageText?.setText(value ?? "");
  }

  private handleFlowPanelPrimaryLabel(_parent: unknown, value: string): void {
    this.setFlowButtonLabel(this.flowPrimaryButton, value);
  }

  private handleFlowPanelSecondaryLabel(_parent: unknown, value: string): void {
    this.setFlowButtonLabel(this.flowSecondaryButton, value);
  }

  private handleFlowPanelTertiaryLabel(_parent: unknown, value: string): void {
    this.setFlowButtonLabel(this.flowTertiaryButton, value);
  }

  private setFlowButtonLabel(
    button: Phaser.GameObjects.Container | undefined,
    value: string
  ): void {
    if (!button) {
      return;
    }

    const label = button.getData("label") as Phaser.GameObjects.Text | undefined;
    label?.setText(value ?? "");
    button.setVisible(!!value);
  }

  private handleDialogueVisible(_parent: unknown, value: boolean): void {
    this.dialogueOverlay?.setVisible(!!value);
  }

  private handleDialogueTitle(_parent: unknown, value: string): void {
    this.dialogueTitleText?.setText(value ?? "");
  }

  private handleDialogueSpeaker(_parent: unknown, value: string): void {
    this.dialogueSpeakerText?.setText(value ?? "");
  }

  private handleDialogueMessage(_parent: unknown, value: string): void {
    this.dialogueMessageText?.setText(value ?? "");
  }

  private handleDialogueHint(_parent: unknown, value: string): void {
    this.dialogueHintText?.setText(value ?? "");
  }

  private handleDialogueBackgroundPath(_parent: unknown, value: string): void {
    if (!this.dialogueBgImage) {
      return;
    }

    this.setDynamicImageTexture(this.dialogueBgImage, value, "dialog-bg");
  }

  private handleDialogueStandingPath(_parent: unknown, value: string): void {
    if (!this.dialogueStandingImage) {
      return;
    }

    this.setDynamicImageTexture(this.dialogueStandingImage, value, "dialog-standing");
  }

  private setDynamicImageTexture(
    image: Phaser.GameObjects.Image,
    assetPath: string,
    keyPrefix: string
  ): void {
    if (!assetPath) {
      image.setVisible(false);
      return;
    }

    const textureKey = `${keyPrefix}:${assetPath}`;
    if (this.textures.exists(textureKey)) {
      image.setTexture(textureKey);
      image.setVisible(true);
      return;
    }

    const url = assetPathToUrl(assetPath);
    this.load.image(textureKey, url);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      if (this.textures.exists(textureKey)) {
        image.setTexture(textureKey);
        image.setVisible(true);
        const scale = Math.min( GAME_WIDTH / image.width, GAME_HEIGHT / image.height);
        image.setScale(scale);
      }
    });
    this.load.start();
  }

  private handleScenarioTitle(_parent: unknown, value: string): void {
    this.scenarioTitleText?.setText(value);
  }

  private handleStageTitle(_parent: unknown, value: string): void {
    this.stageTitleText?.setText(value);
  }

  private handleHeaderHint(_parent: unknown, value: string): void {
    this.headerHintText?.setText(value);
  }

  private handleHeaderTimer(_parent: unknown, value: string): void {
    this.headerTimerText?.setText(value);
  }

  private handleStatusMessage(_parent: unknown, value: string): void {
    this.statusText?.setText(value);
  }

  private handleBattleSummary(_parent: unknown, value: string): void {
    this.battleSummaryText?.setText(value);
  }

  private handleSelectedUnit(_parent: unknown, value: string): void {
    this.selectedUnitText?.setText(`Selected: ${value}`);
  }

  private handleUnitDetailVisible(_parent: unknown, value: boolean): void {
    this.unitDetailOverlay?.setVisible(!!value);
  }

  private handleUnitDetailTitle(_parent: unknown, value: string): void {
    this.unitDetailTitleText?.setText(value ?? "");
  }

  private handleUnitDetailBody(_parent: unknown, value: string): void {
    this.unitDetailBodyText?.setText(value ?? "");
  }

  private handleUnitDetailHint(_parent: unknown, value: string): void {
    this.unitDetailHintText?.setText(value ?? "");
  }

  shutdown(): void {
    this.registry.events.off(`changedata-${UI_STATE_KEYS.flowPanelVisible}`, this.handleFlowPanelVisible, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.flowPanelTitle}`, this.handleFlowPanelTitle, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.flowPanelMessage}`, this.handleFlowPanelMessage, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.flowPanelPrimaryLabel}`, this.handleFlowPanelPrimaryLabel, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.flowPanelSecondaryLabel}`, this.handleFlowPanelSecondaryLabel, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.flowPanelTertiaryLabel}`, this.handleFlowPanelTertiaryLabel, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.dialogueVisible}`, this.handleDialogueVisible, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.dialogueTitle}`, this.handleDialogueTitle, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.dialogueSpeaker}`, this.handleDialogueSpeaker, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.dialogueMessage}`, this.handleDialogueMessage, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.dialogueHint}`, this.handleDialogueHint, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.dialogueBackgroundPath}`, this.handleDialogueBackgroundPath, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.dialogueStandingPath}`, this.handleDialogueStandingPath, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.scenarioTitle}`, this.handleScenarioTitle, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.stageTitle}`, this.handleStageTitle, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.headerHint}`, this.handleHeaderHint, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.headerTimer}`, this.handleHeaderTimer, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.statusMessage}`, this.handleStatusMessage, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.battleSummary}`, this.handleBattleSummary, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.selectedUnitId}`, this.handleSelectedUnit, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.unitDetailVisible}`, this.handleUnitDetailVisible, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.unitDetailTitle}`, this.handleUnitDetailTitle, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.unitDetailBody}`, this.handleUnitDetailBody, this);
    this.registry.events.off(`changedata-${UI_STATE_KEYS.unitDetailHint}`, this.handleUnitDetailHint, this);
  }
}
