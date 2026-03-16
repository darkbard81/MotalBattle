import Phaser from "phaser";
import type { Board } from "../../core/board/Board";
import type { ImageArea } from "../../game/assets";

type HighlightKind = "move" | "swap" | "block" | "idle";

interface BoardViewConfig {
  boardWidth: number;
  boardHeight: number;
  tileSize: number;
  originX: number;
  originY: number;
}

export class BoardView {
  readonly boardWidth: number;
  readonly boardHeight: number;
  readonly tileSize: number;
  readonly originX: number;
  readonly originY: number;
  private readonly cornerDeadzoneRadius: number;
  private readonly highlight: Phaser.GameObjects.Rectangle;
  private backgroundImage?: Phaser.GameObjects.Image;
  private boardGraphics?: Phaser.GameObjects.Graphics;
  private terrainGraphics?: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    config: BoardViewConfig
  ) {
    this.boardWidth = config.boardWidth;
    this.boardHeight = config.boardHeight;
    this.tileSize = config.tileSize;
    this.originX = config.originX;
    this.originY = config.originY;
    this.cornerDeadzoneRadius = Math.max(10, Math.floor(this.tileSize * 0.12));
    this.highlight = this.scene.add.rectangle(0, 0, this.tileSize - 6, this.tileSize - 6);
    this.highlight.setStrokeStyle(3, 0x67e8f9, 0.9);
    this.highlight.setFillStyle(0x67e8f9, 0.12);
    this.highlight.setVisible(false);
  }

  render(
    board: Board,
    options?: {
      backgroundTextureKey?: string;
      backgroundImageArea?: ImageArea;
    }
  ): void {
    this.backgroundImage?.destroy();
    this.boardGraphics?.destroy();
    this.terrainGraphics?.destroy();

    const hasBackgroundTexture =
      !!options?.backgroundTextureKey && this.scene.textures.exists(options.backgroundTextureKey);

    if (hasBackgroundTexture && options?.backgroundTextureKey) {
      const center = this.gridToWorld((this.boardWidth - 1) / 2, (this.boardHeight - 1) / 2);
      const backgroundTextureKey = this.getBackgroundTextureKey(
        options.backgroundTextureKey,
        options.backgroundImageArea
      );
      this.backgroundImage = this.scene.add.image(center.x, center.y, backgroundTextureKey);
      this.backgroundImage.setAlpha(0.96);
      this.backgroundImage.setDepth(-10);
      this.fitBackgroundImage(backgroundTextureKey);
    }

    this.boardGraphics = this.scene.add.graphics();
    this.boardGraphics.setDepth(-5);

    for (let y = 0; y < this.boardHeight; y += 1) {
      for (let x = 0; x < this.boardWidth; x += 1) {
        const rectX = this.originX + x * this.tileSize;
        const rectY = this.originY + y * this.tileSize;

        if (!hasBackgroundTexture) {
          const fill = (x + y) % 2 === 0 ? 0x182032 : 0x111827;
          this.boardGraphics.fillStyle(fill, 1);
          this.boardGraphics.fillRect(rectX, rectY, this.tileSize, this.tileSize);
        } else {
          this.boardGraphics.fillStyle(0x020617, 0.08);
          this.boardGraphics.fillRect(rectX, rectY, this.tileSize, this.tileSize);
        }

        this.boardGraphics.lineStyle(1, 0x334155, hasBackgroundTexture ? 0.45 : 0.95);
        this.boardGraphics.strokeRect(rectX, rectY, this.tileSize, this.tileSize);
      }
    }

    this.terrainGraphics = this.scene.add.graphics();
    this.terrainGraphics.setDepth(-2);

    for (let y = 0; y < board.height; y += 1) {
      for (let x = 0; x < board.width; x += 1) {
        const cell = board.getCell(x, y);
        if (!cell) {
          continue;
        }

        const rectX = this.originX + x * this.tileSize;
        const rectY = this.originY + y * this.tileSize;

        if (cell.terrainType === "wall") {
          this.terrainGraphics.fillStyle(0x334155, 0.42);
          this.terrainGraphics.fillRect(rectX + 4, rectY + 4, this.tileSize - 8, this.tileSize - 8);
        }

        if (cell.terrainType === "hazard") {
          this.terrainGraphics.fillStyle(0xf59e0b, 0.18);
          this.terrainGraphics.fillRect(rectX + 6, rectY + 6, this.tileSize - 12, this.tileSize - 12);
          this.terrainGraphics.lineStyle(2, 0xf59e0b, 0.7);
          this.terrainGraphics.strokeRect(rectX + 10, rectY + 10, this.tileSize - 20, this.tileSize - 20);
        }
      }
    }
  }

  getPixelWidth(): number {
    return this.boardWidth * this.tileSize;
  }

  getPixelHeight(): number {
    return this.boardHeight * this.tileSize;
  }

  gridToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: this.originX + x * this.tileSize + this.tileSize / 2,
      y: this.originY + y * this.tileSize + this.tileSize / 2
    };
  }

  worldToGrid(worldX: number, worldY: number): { x: number; y: number } | null {
    const localX = worldX - this.originX;
    const localY = worldY - this.originY;

    if (localX < 0 || localY < 0) {
      return null;
    }

    const x = Math.floor(localX / this.tileSize);
    const y = Math.floor(localY / this.tileSize);

    if (x < 0 || y < 0 || x >= this.boardWidth || y >= this.boardHeight) {
      return null;
    }

    const offsetX = localX - x * this.tileSize;
    const offsetY = localY - y * this.tileSize;
    const maxOffset = this.tileSize - this.cornerDeadzoneRadius;
    const inLeft = offsetX < this.cornerDeadzoneRadius;
    const inRight = offsetX > maxOffset;
    const inTop = offsetY < this.cornerDeadzoneRadius;
    const inBottom = offsetY > maxOffset;

    if (
      (inLeft && inTop && this.isInsideCornerRadius(offsetX, offsetY)) ||
      (inRight && inTop && this.isInsideCornerRadius(this.tileSize - offsetX, offsetY)) ||
      (inLeft && inBottom && this.isInsideCornerRadius(offsetX, this.tileSize - offsetY)) ||
      (inRight && inBottom && this.isInsideCornerRadius(this.tileSize - offsetX, this.tileSize - offsetY))
    ) {
      return null;
    }

    return { x, y };
  }

  showHighlight(x: number, y: number, kind: HighlightKind): void {
    const world = this.gridToWorld(x, y);
    this.highlight.setPosition(world.x, world.y);

    if (kind === "move") {
      this.highlight.setStrokeStyle(3, 0x22c55e, 0.95);
      this.highlight.setFillStyle(0x22c55e, 0.16);
    } else if (kind === "swap") {
      this.highlight.setStrokeStyle(3, 0xf59e0b, 0.95);
      this.highlight.setFillStyle(0xf59e0b, 0.16);
    } else if (kind === "block") {
      this.highlight.setStrokeStyle(3, 0xef4444, 0.95);
      this.highlight.setFillStyle(0xef4444, 0.16);
    } else {
      this.highlight.setStrokeStyle(3, 0x67e8f9, 0.95);
      this.highlight.setFillStyle(0x67e8f9, 0.12);
    }

    this.highlight.setVisible(true);
  }

  hideHighlight(): void {
    this.highlight.setVisible(false);
  }

  flashCell(x: number, y: number, kind: HighlightKind, duration = 120): void {
    this.showHighlight(x, y, kind);
    this.highlight.setAlpha(1);
    this.scene.tweens.killTweensOf(this.highlight);
    this.scene.tweens.add({
      targets: this.highlight,
      alpha: 0.15,
      duration,
      yoyo: true,
      ease: "Quad.Out",
      onComplete: () => {
        this.highlight.setAlpha(1);
      }
    });
  }

  destroy(): void {
    this.backgroundImage?.destroy();
    this.backgroundImage = undefined;
    this.boardGraphics?.destroy();
    this.boardGraphics = undefined;
    this.terrainGraphics?.destroy();
    this.terrainGraphics = undefined;
    this.highlight.destroy();
  }

  private isInsideCornerRadius(dx: number, dy: number): boolean {
    return dx * dx + dy * dy < this.cornerDeadzoneRadius * this.cornerDeadzoneRadius;
  }

  private fitBackgroundImage(textureKey: string): void {
    if (!this.backgroundImage) {
      return;
    }

    const sourceImage = this.scene.textures.get(textureKey).getSourceImage() as {
      width: number;
      height: number;
    };
    const sourceWidth = sourceImage.width;
    const sourceHeight = sourceImage.height;

    if (!sourceWidth || !sourceHeight) {
      return;
    }

    const scale = Math.min(this.getPixelWidth() / sourceWidth, this.getPixelHeight() / sourceHeight);
    this.backgroundImage.setScale(scale);
  }

  private getBackgroundTextureKey(baseTextureKey: string, imageArea?: ImageArea): string {
    if (!imageArea) {
      return baseTextureKey;
    }

    const { x, y, w, h } = imageArea;
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
