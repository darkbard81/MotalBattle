import Phaser from "phaser";
import { ANIMATION_POLICY } from "./animationPolicy";

type BaseAnimationCommand = {
  key: string;
  duration?: number;
  run: () => void;
  priority?: number;
  blocksBoardInput?: boolean;
};

export type AnimationCommand =
  | ({ type: "assist" } & BaseAnimationCommand)
  | ({ type: "swap" } & BaseAnimationCommand)
  | ({ type: "block" } & BaseAnimationCommand)
  | ({ type: "flash" } & BaseAnimationCommand)
  | ({ type: "hit" } & BaseAnimationCommand)
  | ({ type: "die" } & BaseAnimationCommand)
  | ({ type: "noop" } & BaseAnimationCommand);

export class AnimationQueue {
  private queue: AnimationCommand[] = [];
  private isRunning = false;
  private currentCommand?: AnimationCommand;
  private onBusyChange?: (busy: boolean) => void;

  constructor(private readonly scene: Phaser.Scene) {}

  setBusyChangeListener(listener: ((busy: boolean) => void) | undefined): void {
    this.onBusyChange = listener;
  }

  enqueue(command: AnimationCommand): void {
    this.insertByPriority(command);
    this.flush();
  }

  clear(): void {
    this.queue = [];
    this.isRunning = false;
    this.currentCommand = undefined;
    this.onBusyChange?.(false);
  }

  private insertByPriority(command: AnimationCommand): void {
    const commandPriority = this.resolvePriority(command);
    const insertAt = this.queue.findIndex(
      (queuedCommand) => commandPriority > this.resolvePriority(queuedCommand)
    );

    if (insertAt < 0) {
      this.queue.push(command);
      return;
    }

    this.queue.splice(insertAt, 0, command);
  }

  private resolvePriority(command: AnimationCommand): number {
    return command.priority ?? ANIMATION_POLICY[command.type].priority;
  }

  private resolveDuration(command: AnimationCommand): number {
    return command.duration ?? ANIMATION_POLICY[command.type].durationMs;
  }

  private resolveBlocksBoardInput(command: AnimationCommand): boolean {
    return command.blocksBoardInput ?? ANIMATION_POLICY[command.type].blocksBoardInput;
  }

  private emitBusyState(): void {
    const busy = this.currentCommand ? this.resolveBlocksBoardInput(this.currentCommand) : false;
    this.onBusyChange?.(busy);
  }

  private flush(): void {
    if (this.isRunning) {
      return;
    }

    const command = this.queue.shift();
    if (!command) {
      this.currentCommand = undefined;
      this.emitBusyState();
      return;
    }

    this.isRunning = true;
    this.currentCommand = command;
    this.emitBusyState();
    command.run();

    const duration = this.resolveDuration(command);
    this.scene.time.delayedCall(duration, () => {
      this.isRunning = false;
      this.currentCommand = undefined;
      this.flush();
    });
  }
}
