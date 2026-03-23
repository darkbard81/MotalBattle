import Phaser from "phaser";

export type AnimationCommand =
  | {
      type: "assist";
      key: string;
      duration?: number;
      run: () => void;
    }
  | {
      type: "swap";
      key: string;
      duration?: number;
      run: () => void;
    }
  | {
      type: "block";
      key: string;
      duration?: number;
      run: () => void;
    }
  | {
      type: "flash";
      key: string;
      duration?: number;
      run: () => void;
    }
  | {
      type: "hit";
      key: string;
      duration?: number;
      run: () => void;
    }
  | {
      type: "die";
      key: string;
      duration?: number;
      run: () => void;
    }
  | {
      type: "noop";
      key: string;
      duration?: number;
      run: () => void;
    };

export class AnimationQueue {
  private queue: AnimationCommand[] = [];
  private isRunning = false;
  private onBusyChange?: (busy: boolean) => void;

  constructor(private readonly scene: Phaser.Scene) {}

  setBusyChangeListener(listener: ((busy: boolean) => void) | undefined): void {
    this.onBusyChange = listener;
  }

  enqueue(command: AnimationCommand): void {
    this.queue.push(command);
    this.flush();
  }

  clear(): void {
    this.queue = [];
    if (this.isRunning) {
      this.isRunning = false;
      this.onBusyChange?.(false);
    }
  }

  private flush(): void {
    if (this.isRunning) {
      return;
    }

    const command = this.queue.shift();
    if (!command) {
      return;
    }

    const wasRunning = this.isRunning;
    this.isRunning = true;
    if (!wasRunning) {
      this.onBusyChange?.(true);
    }
    command.run();

    const durationMap: Record<AnimationCommand["type"], number> = {
      assist: 1000,
      swap: 180,
      block: 100,
      flash: 120,
      hit: 180,
      die: 220,
      noop: 0
    };
    const duration = command.duration ?? durationMap[command.type];
    this.scene.time.delayedCall(duration, () => {
      if (this.queue.length > 0) {
        this.isRunning = false;
        this.flush();
        return;
      }

      this.isRunning = false;
      this.onBusyChange?.(false);
    });
  }
}
