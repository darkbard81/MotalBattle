import Phaser from "phaser";
import type { Board } from "../../core/board/Board";
import {
  createBoardFromStageData,
  type StageData,
  type UnitCatalog
} from "../../core/data/StageLoader";
import {
  getDialogForScenarioStep,
  getNextScenarioStep,
  getStageForScenarioStep,
  getStartingStep,
  type ScenarioDefinition,
  type ScenarioStep
} from "../../core/data/ScenarioLoader";
import type { DialogData } from "../../core/data/DialogLoader";
import type { BattleEvent } from "../../core/rules/RuleTypes";
import { ObjectiveManager, type ObjectiveStatus } from "../../core/rules/ObjectiveManager";
import {
  getDebugUnitCatalog,
  getScenarioDefinitionById
} from "../../core/debug/debugScenario";
import { getStageBackgroundTextureKey, getUnitTextureKey } from "../../game/assets";
import { DEBUG_ON, GAME_HEIGHT, GAME_WIDTH } from "../../game/constants";
import { debugSceneInit } from "../../game/debug";
import { UI_STATE_KEYS } from "../../game/uiState";
import { AnimationQueue } from "../animation/AnimationQueue";
import { DragController } from "../input/DragController";
import { BoardView } from "../objects/BoardView";
import { UnitView } from "../objects/UnitView";
import { UIScene } from "./UIScene";

export class GameScene extends Phaser.Scene {
  static readonly KEY = "GameScene";
  private readonly unitCatalog: UnitCatalog = getDebugUnitCatalog();
  private readonly tileSize = 128;
  private scenarioDefinition!: ScenarioDefinition;
  private board?: Board;
  private readonly unitViews = new Map<string, UnitView>();
  private readonly animationQueue = new AnimationQueue(this);
  private boardInputLocked = false;
  private selectedUnitId: string | null = null;
  private boardView?: BoardView;
  private dragController?: DragController;
  private activeSwapAnimation?: string;
  private dyingUnitIds = new Set<string>();
  private currentStep?: ScenarioStep;
  private currentStage?: StageData;
  private currentDialog?: DialogData;
  private currentDialogIndex = 0;
  private readonly objectiveManager = new ObjectiveManager();
  private currentTurn = 0;
  private currentObjectiveStatus: ObjectiveStatus = "ongoing";
  private pendingTransition = false;
  private unitDetailVisible = false;
  private flowActions: Partial<Record<"primary" | "secondary" | "tertiary", () => void>> = {};
  private currentPreview:
    | {
        unitId: string | null;
        pointerWorld: { x: number; y: number } | null;
        cell: { x: number; y: number } | null;
        kind: "move" | "swap" | "block" | "idle";
      }
    | undefined;

  constructor() {
    super(GameScene.KEY);
  }

  init(data?: { scenarioId?: string }): void {
    this.scenarioDefinition = getScenarioDefinitionById(data?.scenarioId ?? "debug-scenario");
  }

  create(): void {
    this.animationQueue.setBusyChangeListener((busy) => {
      this.boardInputLocked = busy;
    });
    this.registry.set(
      UI_STATE_KEYS.scenarioTitle,
      `Scenario: ${this.scenarioDefinition.scenario.title}`
    );
    this.bindDialogueAdvanceInput();
    this.game.events.on(UIScene.FLOW_ACTION_EVENT, this.handleFlowAction, this);
    this.game.events.on(UIScene.UNIT_DETAIL_CLOSE_EVENT, this.hideUnitDetail, this);

    const startingStep = getStartingStep(this.scenarioDefinition.scenario);
    this.enterScenarioStep(startingStep);
  }

  private enterScenarioStep(step: ScenarioStep): void {
    this.currentStep = step;
    this.currentDialog = undefined;
    this.currentDialogIndex = 0;
    this.hideFlowPanel();
    this.registry.set(UI_STATE_KEYS.selectedUnitId, "-");
    this.updateHeaderTimer(false, 0, 5000);

    if (step.type === "dialogue") {
      const dialog = getDialogForScenarioStep(this.scenarioDefinition, step);
      if (dialog) {
        this.currentDialog = dialog;
        this.registry.set(UI_STATE_KEYS.stageTitle, `Dialogue: ${dialog.title}`);
        this.showDialogueEntry(dialog, 0);
        this.updateBattleSummary("Dialogue step. Press SPACE or click to continue.");
        return;
      }

      this.registry.set(UI_STATE_KEYS.stageTitle, `Dialogue: ${step.title}`);
      this.updateStatus(step.description ?? step.title);
      this.updateBattleSummary("Dialogue step. Press SPACE or click to continue.");
      this.registry.set(UI_STATE_KEYS.dialogueVisible, true);
      this.registry.set(UI_STATE_KEYS.dialogueTitle, step.title);
      this.registry.set(UI_STATE_KEYS.dialogueSpeaker, step.speaker ?? "");
      this.registry.set(UI_STATE_KEYS.dialogueMessage, (step.lines ?? []).join("\n"));
      this.registry.set(UI_STATE_KEYS.dialogueBackgroundPath, "");
      this.registry.set(UI_STATE_KEYS.dialogueStandingPath, "");
      return;
    }

    this.registry.set(UI_STATE_KEYS.dialogueVisible, false);
    const stage = getStageForScenarioStep(this.scenarioDefinition, step);
    if (!stage) {
      this.updateStatus(`Stage step ${step.id} is missing stage data.`);
      return;
    }

    this.loadStage(stage);
  }

  private loadStage(stage: StageData): void {
    this.destroyStagePresentation();
    this.currentStage = stage;
    this.currentTurn = 0;
    this.board = createBoardFromStageData(stage, this.unitCatalog);

    const boardPixelWidth = this.board.width * this.tileSize;
    const boardPixelHeight = this.board.height * this.tileSize;
    const originX = (GAME_WIDTH - boardPixelWidth) / 2;
    const originY = (GAME_HEIGHT - boardPixelHeight) / 2;

    this.boardView = new BoardView(this, {
      boardWidth: this.board.width,
      boardHeight: this.board.height,
      tileSize: this.tileSize,
      originX,
      originY
    });
    this.boardView.render(this.board, {
      backgroundTextureKey: stage.background_path
        ? getStageBackgroundTextureKey(stage.id)
        : undefined,
      backgroundImageArea: stage.image_area
    });

    this.dragController = new DragController(this, this.board, this.boardView, {
      isInputBlocked: () => this.boardInputLocked,
      onSelectionChange: (unitId) => {
        this.selectedUnitId = unitId;
        this.registry.set(UI_STATE_KEYS.selectedUnitId, unitId ?? "-");
        this.syncUnitViews();
      },
      onInspect: ({ unitId }) => {
        this.showUnitDetail(unitId);
      },
      onStatus: (message) => {
        this.updateStatus(message);
      },
      onBoardChange: () => {
        this.syncUnitViews();
      },
      onBattleResolved: (summary) => {
        this.currentTurn += 1;
        this.currentObjectiveStatus = this.evaluateCurrentObjectiveStatus();
        this.updateBattleSummary(summary);
        this.checkStageCompletion();
      },
      onBlock: () => {},
      onBattleEvents: ({ playerBattleEvents, defeatedUnitIds, hazardTargetIds }) => {
        const allyBattleEvents = playerBattleEvents.filter((battleEvent) =>
          battleEvent.attackerIds.every((attackerId) => this.unitCatalog[attackerId]?.team === "ally")
        );
        const allyHitTargetIds = allyBattleEvents.map((battleEvent) => battleEvent.targetId);

        for (const battleEvent of allyBattleEvents) {
          if (
            battleEvent.pattern === "sandwich-horizontal" ||
            battleEvent.pattern === "sandwich-vertical"
          ) {
            this.animationQueue.enqueue({
              type: "assist",
              key: `assist:${battleEvent.targetId}:${battleEvent.attackerIds.join(":")}:${this.time.now}`,
              duration: 1000,
              run: () => {
                this.playAssistAttackAnimation(battleEvent);
              }
            });
          }
        }

        for (const targetId of allyHitTargetIds) {
          this.animationQueue.enqueue({
            type: "hit",
            key: `hit:${targetId}:${this.time.now}`,
            duration: 180,
            run: () => {
              this.playHitAnimation(targetId);
            }
          });
        }

        for (const targetId of hazardTargetIds) {
          this.animationQueue.enqueue({
            type: "flash",
            key: `hazard:${targetId}:${this.time.now}`,
            duration: 120,
            run: () => {
              this.playHitAnimation(targetId);
            }
          });
        }

        for (const defeatedUnitId of defeatedUnitIds) {
          this.animationQueue.enqueue({
            type: "die",
            key: `die:${defeatedUnitId}:${this.time.now}`,
            duration: 220,
            run: () => {
              this.playDieAnimation(defeatedUnitId);
            }
          });
        }
      },
      onTimerChange: ({ active, remainingMs, totalMs }) => {
        this.updateHeaderTimer(active, remainingMs, totalMs);
      },
      onSwap: ({ swappedUnitId }) => {
        this.animationQueue.enqueue({
          type: "swap",
          key: `swap:${swappedUnitId}:${this.time.now}`,
          duration: 180,
          run: () => {
            this.playSwapAnimation(swappedUnitId);
          }
        });
      },
      onPreview: (preview) => {
        this.currentPreview = preview;
        this.syncUnitViews();
        this.syncBoardPreview();
      }
    });
    this.dragController.bind();

    this.registry.set(UI_STATE_KEYS.stageTitle, `Stage: ${stage.title ?? stage.id}`);
    this.updateStatus(stage.description ?? "Ready: drag an ally. Battle resolves on release or after 5 seconds.");
    this.updateBattleSummary(stage.objective ? `Objective: ${stage.objective}` : "Objective: none");
    this.updateHeaderTimer(false, 0, 5000);
    this.syncUnitViews();
    this.currentObjectiveStatus = this.evaluateCurrentObjectiveStatus();
    this.checkStageCompletion();

    debugSceneInit({
      debugOn: DEBUG_ON,
      unitCount: this.board.getAllUnits().length,
      units: this.board.getAllUnits().map((unit) => ({
        id: unit.id,
        team: unit.team,
        hp: unit.hp,
        position: unit.gridPos
      }))
    });
  }

  private bindDialogueAdvanceInput(): void {
    this.input.on("pointerdown", () => {
      if (this.unitDetailVisible) {
        this.hideUnitDetail();
        return;
      }

      this.advanceDialogue();
    });
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.advanceDialogue();
    });
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.advanceDialogue();
    });
  }

  private showDialogueEntry(dialog: DialogData, index: number): void {
    const entry = dialog.steps[index];
    if (!entry) {
      return;
    }

    this.currentDialogIndex = index;
    this.registry.set(UI_STATE_KEYS.dialogueVisible, true);
    this.registry.set(UI_STATE_KEYS.dialogueTitle, dialog.title);
    this.registry.set(UI_STATE_KEYS.dialogueSpeaker, entry.speaker ?? entry.msg_type);
    this.registry.set(UI_STATE_KEYS.dialogueMessage, entry.message);
    this.registry.set(UI_STATE_KEYS.dialogueHint, "SPACE / ENTER / click");
    this.registry.set(UI_STATE_KEYS.dialogueBackgroundPath, entry.background);
    this.registry.set(UI_STATE_KEYS.dialogueStandingPath, entry.standing ?? "");
    this.updateStatus(`Dialogue ${index + 1}/${dialog.steps.length}`);
  }

  private advanceDialogue(): void {
    if (
      !this.currentStep ||
      this.currentStep.type !== "dialogue" ||
      this.pendingTransition ||
      this.registry.get(UI_STATE_KEYS.flowPanelVisible)
    ) {
      return;
    }

    if (this.currentDialog) {
      const nextIndex = this.currentDialogIndex + 1;
      if (nextIndex < this.currentDialog.steps.length) {
        this.showDialogueEntry(this.currentDialog, nextIndex);
        return;
      }
    }

    this.pendingTransition = true;
    this.registry.set(UI_STATE_KEYS.dialogueVisible, false);
    const nextStep = getNextScenarioStep(this.scenarioDefinition.scenario, this.currentStep.id);
    this.pendingTransition = false;

    if (nextStep) {
      this.enterScenarioStep(nextStep);
      return;
    }

    this.updateStatus("Scenario complete.");
    this.updateBattleSummary("All scenario steps cleared.");
  }

  private destroyStagePresentation(): void {
    this.dragController?.destroy();
    this.dragController = undefined;
    this.boardView?.destroy();
    this.boardView = undefined;

    for (const [, view] of this.unitViews) {
      view.destroy();
    }

    this.unitViews.clear();
    this.selectedUnitId = null;
    this.activeSwapAnimation = undefined;
    this.currentPreview = undefined;
    this.hideUnitDetail();
    this.dyingUnitIds.clear();
    this.animationQueue.clear();
    this.boardInputLocked = false;
  }

  private showUnitDetail(unitId: string): void {
    if (!this.board) {
      return;
    }

    const unit = this.board.getUnit(unitId);
    const unitData = this.unitCatalog[unitId];
    if (!unit || !unitData) {
      return;
    }

    this.unitDetailVisible = true;
    this.registry.set(UI_STATE_KEYS.unitDetailVisible, true);
    this.registry.set(
      UI_STATE_KEYS.unitDetailTitle,
      `${unitData.name} (${unit.team === "ally" ? "ALLY" : "ENEMY"})`
    );
    this.registry.set(
      UI_STATE_KEYS.unitDetailBody,
      [
        `ID: ${unit.id}`,
        `Position: (${unit.gridPos.x}, ${unit.gridPos.y})`,
        `HP: ${unit.hp}/${unit.maxHp}`,
        `ATK / DEF: ${unit.atk} / ${unit.def}`,
        `Weight: ${unit.weight}`,
        `Pushable: ${unit.canBePushed ? "Yes" : "No"}`,
        `State: moved=${unit.state.hasMoved ? "Y" : "N"}, acted=${unit.state.hasActed ? "Y" : "N"}, stunned=${unit.state.stunned ? "Y" : "N"}`
      ].join("\n")
    );
    this.registry.set(UI_STATE_KEYS.unitDetailHint, "Click anywhere to close");
    this.updateStatus(`${unitData.name} detail open.`);
  }

  private hideUnitDetail(): void {
    if (!this.unitDetailVisible) {
      return;
    }

    this.unitDetailVisible = false;
    this.registry.set(UI_STATE_KEYS.unitDetailVisible, false);
    this.registry.set(UI_STATE_KEYS.unitDetailTitle, "");
    this.registry.set(UI_STATE_KEYS.unitDetailBody, "");
    this.registry.set(UI_STATE_KEYS.unitDetailHint, "Click to close");
  }

  private evaluateCurrentObjectiveStatus(): ObjectiveStatus {
    if (!this.board) {
      return "ongoing";
    }

    return this.objectiveManager.evaluate(this.currentStage?.objectives ?? [], {
      board: this.board,
      currentTurn: this.currentTurn,
      turnLimit: this.currentStage?.turnLimit
    });
  }

  private checkStageCompletion(): void {
    if (!this.board || !this.currentStep || this.pendingTransition) {
      return;
    }

    if (this.currentObjectiveStatus === "ongoing") {
      return;
    }

    const result = this.currentObjectiveStatus;
    const isSuccess = result === "success";
    const nextStep = getNextScenarioStep(this.scenarioDefinition.scenario, this.currentStep.id, result);

    if (isSuccess) {
      this.updateStatus(`Stage clear: ${this.currentStage?.title ?? this.currentStep.title}`);
      this.updateBattleSummary("Stage cleared.");
    } else {
      this.updateStatus(`Stage failed: ${this.currentStage?.title ?? this.currentStep.title}`);
      this.updateBattleSummary("Stage failed.");
    }

    if (!nextStep) {
      if (!isSuccess) {
        this.showFlowPanel({
          title: "Stage Failed",
          message: "Objective failed. Choose the next action.",
          primaryLabel: "Retry",
          secondaryLabel: "Back To Title",
          tertiaryLabel: "",
          actions: {
            primary: () => {
              if (this.currentStage) {
                this.loadStage(this.currentStage);
              }
            },
            secondary: () => {
              this.scene.stop(UIScene.KEY);
              this.scene.start("TitleScene");
            }
          }
        });
        return;
      }

      this.showFlowPanel({
        title: "Scenario Complete",
        message: "All scenario steps cleared.",
        primaryLabel: "Back To Title",
        secondaryLabel: "Retry Stage",
        tertiaryLabel: "",
        actions: {
          primary: () => {
            this.scene.stop(UIScene.KEY);
            this.scene.start("TitleScene");
          },
          secondary: () => {
            if (this.currentStage) {
              this.loadStage(this.currentStage);
            }
          }
        }
      });
      return;
    }

    this.showFlowPanel({
      title: isSuccess ? "Stage Clear" : "Stage Failed",
      message: `Next: ${nextStep.title}`,
      primaryLabel: "Continue",
      secondaryLabel: "Retry",
      tertiaryLabel: "Back To Title",
      actions: {
        primary: () => {
          this.enterScenarioStep(nextStep);
        },
        secondary: () => {
          if (this.currentStage) {
            this.loadStage(this.currentStage);
          }
        },
        tertiary: () => {
          this.scene.stop(UIScene.KEY);
          this.scene.start("TitleScene");
        }
      }
    });
  }

  private showFlowPanel(config: {
    title: string;
    message: string;
    primaryLabel: string;
    secondaryLabel?: string;
    tertiaryLabel?: string;
    actions: Partial<Record<"primary" | "secondary" | "tertiary", () => void>>;
  }): void {
    this.pendingTransition = true;
    this.flowActions = config.actions;
    this.registry.set(UI_STATE_KEYS.flowPanelTitle, config.title);
    this.registry.set(UI_STATE_KEYS.flowPanelMessage, config.message);
    this.registry.set(UI_STATE_KEYS.flowPanelPrimaryLabel, config.primaryLabel);
    this.registry.set(UI_STATE_KEYS.flowPanelSecondaryLabel, config.secondaryLabel ?? "");
    this.registry.set(UI_STATE_KEYS.flowPanelTertiaryLabel, config.tertiaryLabel ?? "");
    this.registry.set(UI_STATE_KEYS.flowPanelVisible, true);
  }

  private hideFlowPanel(): void {
    this.pendingTransition = false;
    this.flowActions = {};
    this.registry.set(UI_STATE_KEYS.flowPanelVisible, false);
    this.registry.set(UI_STATE_KEYS.flowPanelTitle, "");
    this.registry.set(UI_STATE_KEYS.flowPanelMessage, "");
    this.registry.set(UI_STATE_KEYS.flowPanelPrimaryLabel, "");
    this.registry.set(UI_STATE_KEYS.flowPanelSecondaryLabel, "");
    this.registry.set(UI_STATE_KEYS.flowPanelTertiaryLabel, "");
  }

  private handleFlowAction(action: "primary" | "secondary" | "tertiary"): void {
    const handler = this.flowActions[action];
    if (!handler) {
      return;
    }

    this.hideFlowPanel();
    handler();
  }

  private syncUnitViews(): void {
    if (!this.boardView || !this.board) {
      return;
    }

    const activeIds = new Set<string>();

    for (const unit of this.board.getAllUnits()) {
      activeIds.add(unit.id);
      const existing = this.unitViews.get(unit.id);

      if (existing) {
        if (this.dyingUnitIds.has(unit.id)) {
          continue;
        }

        const shouldAnimateSwap = this.activeSwapAnimation === unit.id;

        if (shouldAnimateSwap) {
          existing.animateToGrid(unit);
        } else {
          existing.sync(unit);
        }
        existing.setSelected(unit.id === this.selectedUnitId);
        if (
          this.currentPreview?.unitId === unit.id &&
          this.currentPreview.pointerWorld &&
          this.selectedUnitId === unit.id
        ) {
          existing.setDragPreview(this.currentPreview.pointerWorld.x, this.currentPreview.pointerWorld.y);
        } else {
          existing.clearDragPreview(unit);
        }
        continue;
      }

      const unitView = new UnitView(this, this.boardView, unit);
      unitView.setSelected(unit.id === this.selectedUnitId);
      if (
        this.currentPreview?.unitId === unit.id &&
        this.currentPreview.pointerWorld &&
        this.selectedUnitId === unit.id
      ) {
        unitView.setDragPreview(this.currentPreview.pointerWorld.x, this.currentPreview.pointerWorld.y);
      }
      this.unitViews.set(unit.id, unitView);
    }

    for (const [unitId, view] of this.unitViews.entries()) {
      if (activeIds.has(unitId) || this.dyingUnitIds.has(unitId)) {
        continue;
      }

      view.destroy();
      this.unitViews.delete(unitId);
    }
  }

  private syncBoardPreview(): void {
    if (!this.boardView) {
      return;
    }

    if (!this.currentPreview?.cell) {
      this.boardView.hideHighlight();
      return;
    }

    this.boardView.showHighlight(
      this.currentPreview.cell.x,
      this.currentPreview.cell.y,
      this.currentPreview.kind
    );
  }

  private updateStatus(message: string): void {
    this.registry.set(UI_STATE_KEYS.statusMessage, message);
  }

  private updateBattleSummary(message: string): void {
    this.registry.set(UI_STATE_KEYS.battleSummary, message);
  }

  private updateHeaderTimer(active: boolean, remainingMs: number, totalMs: number): void {
    const seconds = active ? (remainingMs / 1000).toFixed(2) : (totalMs / 1000).toFixed(2);
    this.registry.set(UI_STATE_KEYS.headerTimer, `${seconds}s`);

    if (!active) {
      this.registry.set(UI_STATE_KEYS.headerHint, "Header: drag timer idle");
      return;
    }

    this.registry.set(
      UI_STATE_KEYS.headerHint,
      remainingMs < 1500 ? "Header: drag timer active (low)" : "Header: drag timer active"
    );
  }

  private playSwapAnimation(swappedUnitId: string): void {
    this.activeSwapAnimation = swappedUnitId;
    this.syncUnitViews();
    this.time.delayedCall(180, () => {
      if (this.activeSwapAnimation === swappedUnitId) {
        this.activeSwapAnimation = undefined;
      }
    });
  }

  private playAssistAttackAnimation(event: BattleEvent): void {
    const overlayY = GAME_HEIGHT - 120;
    const centerX = GAME_WIDTH / 2;
    const startInset = 80;
    const endOffset = 180;
    const leftTextureKey = getUnitTextureKey(event.attackerIds[0] ?? "");
    const rightTextureKey = getUnitTextureKey(event.attackerIds[1] ?? "");
    const overlays: Phaser.GameObjects.Image[] = [];

    if (this.textures.exists(leftTextureKey)) {
      const leftImage = this.createAssistOverlayImage(leftTextureKey, startInset, overlayY, 0);
      overlays.push(leftImage);
    }

    if (this.textures.exists(rightTextureKey)) {
      const rightImage = this.createAssistOverlayImage(rightTextureKey, GAME_WIDTH - startInset, overlayY, 1);
      overlays.push(rightImage);
    }

    if (overlays.length === 0) {
      return;
    }

    const [leftOverlay, rightOverlay] = overlays;

    if (leftOverlay) {
      this.tweens.add({
        targets: leftOverlay,
        x: centerX - endOffset,
        alpha: 0.92,
        duration: 500,
        ease: "Sine.Out",
        yoyo: true,
        onComplete: () => {
          leftOverlay.destroy();
        }
      });
    }

    if (rightOverlay) {
      this.tweens.add({
        targets: rightOverlay,
        x: centerX + endOffset,
        alpha: 0.92,
        duration: 500,
        ease: "Sine.Out",
        yoyo: true,
        onComplete: () => {
          rightOverlay.destroy();
        }
      });
    }
  }

  private createAssistOverlayImage(
    textureKey: string,
    x: number,
    y: number,
    originX: number
  ): Phaser.GameObjects.Image {
    const image = this.add.image(x, y, textureKey);
    image.setOrigin(originX, 1);
    image.setDepth(50);
    image.setAlpha(0);

    const sourceImage = this.textures.get(textureKey).getSourceImage() as {
      width: number;
      height: number;
    };
    const maxHeight = GAME_HEIGHT * 0.78;
    const maxWidth = GAME_WIDTH * 0.24;
    const scale = Math.min(maxWidth / sourceImage.width, maxHeight / sourceImage.height);
    image.setScale(scale);

    return image;
  }

  private playHitAnimation(unitId: string): void {
    const unitView = this.unitViews.get(unitId);
    if (!unitView) {
      return;
    }

    unitView.playHitEffect();
  }

  private playDieAnimation(unitId: string): void {
    const unitView = this.unitViews.get(unitId);
    if (!unitView) {
      return;
    }

    this.dyingUnitIds.add(unitId);
    unitView.playDieEffect();
    this.time.delayedCall(220, () => {
      this.dyingUnitIds.delete(unitId);
      unitView.destroy();
      this.unitViews.delete(unitId);
    });
  }

  shutdown(): void {
    this.game.events.off(UIScene.FLOW_ACTION_EVENT, this.handleFlowAction, this);
  }
}
