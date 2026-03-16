import Phaser from "phaser";
import type { Unit } from "../../core/unit/Unit";
import { getUnitTextureKey } from "../../game/assets";
import { BoardView } from "./BoardView";

export class UnitView {
  readonly unitId: string;
  private readonly container: Phaser.GameObjects.Container;
  private readonly hpLabel: Phaser.GameObjects.Text;
  private readonly selectionFrame: Phaser.GameObjects.Graphics;
  private readonly bodyFrame: Phaser.GameObjects.Graphics;
  private readonly spriteImage?: Phaser.GameObjects.Image;
  private readonly baseFill: number;
  private readonly frameSize: number;
  private readonly frameRadius: number;
  private readonly spriteBounds: number;
  private spriteBaseScale: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly boardView: BoardView,
    unit: Unit
  ) {
    this.unitId = unit.id;

    const world = this.boardView.gridToWorld(unit.gridPos.x, unit.gridPos.y);
    this.container = this.scene.add.container(world.x, world.y);

    const fill = unit.team === "ally" ? 0x22c55e : 0xef4444;
    this.baseFill = fill;
    this.frameSize = this.boardView.tileSize - 8;
    this.frameRadius = Math.max(8, Math.floor(this.boardView.tileSize * 0.16));
    this.spriteBounds = this.frameSize - 2;
    this.spriteBaseScale = 1;

    this.selectionFrame = this.scene.add.graphics();
    this.redrawSelectionFrame();
    this.selectionFrame.setVisible(false);

    this.bodyFrame = this.scene.add.graphics();
    this.redrawBodyFrame(fill, 0.32);

    const baseTextureKey = getUnitTextureKey(unit.id);
    if (this.scene.textures.exists(baseTextureKey)) {
      const spriteTextureKey = this.getSpriteTextureKey(baseTextureKey, unit);
      this.spriteImage = this.scene.add.image(0, 2, spriteTextureKey);
      this.spriteBaseScale = this.fitSpriteIntoFrame(spriteTextureKey);
      // this.spriteBaseScale = this.boardView.tileSize / this.spriteImage.height;
    }

    const label = this.scene.add.text(0, -6, unit.id.slice(0, 3).toUpperCase(), {
      color: "#f8fafc",
      fontFamily: "monospace",
      fontSize: "10px"
    }).setOrigin(0.5);
    label.setVisible(!this.spriteImage);

    this.hpLabel = this.scene.add.text(0, 12, `${unit.hp}/${unit.maxHp}`, {
      color: "#e2e8f0",
      fontFamily: "monospace",
      fontSize: "10px"
    }).setOrigin(0.5);

    this.container.add([
      this.selectionFrame,
      this.bodyFrame,
      ...(this.spriteImage ? [this.spriteImage] : []),
      label,
      this.hpLabel
    ]);
  }

  sync(unit: Unit): void {
    const world = this.boardView.gridToWorld(unit.gridPos.x, unit.gridPos.y);
    this.container.setPosition(world.x, world.y);
    this.hpLabel.setText(`${unit.hp}/${unit.maxHp}`);
  }

  setSelected(selected: boolean): void {
    this.selectionFrame.setVisible(selected);
  }

  setDragPreview(worldX: number, worldY: number): void {
    this.container.setPosition(worldX, worldY);
    this.container.setAlpha(0.88);
    this.bodyFrame.setScale(1.06);
  }

  clearDragPreview(unit: Unit): void {
    this.sync(unit);
    this.container.setAlpha(1);
    this.bodyFrame.setScale(1);
    if (this.spriteImage) {
      this.spriteImage.setScale(this.spriteBaseScale);
    }
  }

  animateToGrid(unit: Unit, duration = 140): void {
    const world = this.boardView.gridToWorld(unit.gridPos.x, unit.gridPos.y);
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      x: world.x,
      y: world.y,
      duration,
      ease: "Quad.Out",
      onStart: () => {
        this.container.setAlpha(1);
        this.bodyFrame.setScale(1.04);
        if (this.spriteImage) {
          this.spriteImage.setScale(this.spriteBaseScale * 1.02);
        }
      },
      onComplete: () => {
        this.bodyFrame.setScale(1);
        if (this.spriteImage) {
          this.spriteImage.setScale(this.spriteBaseScale);
        }
      }
    });
    this.hpLabel.setText(`${unit.hp}/${unit.maxHp}`);
  }

  playHitEffect(duration = 160): void {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.08,
      scaleY: 1.08,
      duration,
      yoyo: true,
      ease: "Quad.Out"
    });
    this.redrawBodyFrame(0xfca5a5, 1);
    this.spriteImage?.setTint(0xffd4d4);
    this.scene.time.delayedCall(duration, () => {
      this.redrawBodyFrame(this.baseFill, 0.32);
      this.spriteImage?.clearTint();
    });
  }

  playDieEffect(duration = 200): void {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: 0.7,
      scaleY: 0.7,
      duration,
      ease: "Quad.In"
    });
  }

  destroy(): void {
    this.container.destroy(true);
  }

  private redrawSelectionFrame(): void {
    const origin = -this.frameSize / 2;
    this.selectionFrame.clear();
    this.selectionFrame.lineStyle(2, 0xf8fafc, 0.95);
    this.selectionFrame.strokeRoundedRect(
      origin,
      origin,
      this.frameSize,
      this.frameSize,
      this.frameRadius
    );
  }

  private redrawBodyFrame(fill: number, alpha: number): void {
    const origin = -this.frameSize / 2;
    this.bodyFrame.clear();
    this.bodyFrame.fillStyle(fill, alpha);
    this.bodyFrame.fillRoundedRect(
      origin,
      origin,
      this.frameSize,
      this.frameSize,
      this.frameRadius
    );
    this.bodyFrame.lineStyle(1, 0xf8fafc, 0.18);
    this.bodyFrame.strokeRoundedRect(
      origin,
      origin,
      this.frameSize,
      this.frameSize,
      this.frameRadius
    );
  }

  private fitSpriteIntoFrame(textureKey: string): number {
    if (!this.spriteImage) {
      return 1;
    }

    const frame = this.scene.textures.get(textureKey).getSourceImage() as {
      width: number;
      height: number;
    };
    const sourceWidth = frame.width;
    const sourceHeight = frame.height;

    if (!sourceWidth || !sourceHeight) {
      const fallbackScale = this.spriteBounds / Math.max(frame.width, frame.height, 1);
      this.spriteImage.setScale(fallbackScale);
      return fallbackScale;
    }

    const scale = Math.min(this.spriteBounds / sourceWidth, this.spriteBounds / sourceHeight);
    this.spriteImage.setScale(scale);
    return scale;
  }

  private getSpriteTextureKey(baseTextureKey: string, unit: Unit): string {
    if (!unit.image_area) {
      return baseTextureKey;
    }

    const { x, y, w, h } = unit.image_area;
    const croppedTextureKey = `${baseTextureKey}:cropped:${x}:${y}:${w}:${h}`;
    if (this.scene.textures.exists(croppedTextureKey)) {
      return croppedTextureKey;
    }

    const sourceImage = this.scene.textures.get(baseTextureKey).getSourceImage() as CanvasImageSource;
    const canvasTexture = this.scene.textures.createCanvas(croppedTextureKey, w, h);
    if (!canvasTexture) {
      return baseTextureKey;
    }

    const context = canvasTexture.getContext();
    context.clearRect(0, 0, w, h);
    context.drawImage(sourceImage, x, y, w, h, 0, 0, w, h);
    canvasTexture.refresh();

    return croppedTextureKey;
  }
}
