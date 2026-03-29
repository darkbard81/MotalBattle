import { describe, expect, it } from "vitest";
import { AnimationQueue } from "./AnimationQueue";

type DelayedCall = {
  duration: number;
  callback: () => void;
};

function createSceneStub() {
  const delayedCalls: DelayedCall[] = [];
  const scene = {
    time: {
      delayedCall: (duration: number, callback: () => void) => {
        delayedCalls.push({ duration, callback });
      }
    }
  };

  return {
    scene,
    delayedCalls,
    runNextTimer: () => {
      const next = delayedCalls.shift();
      if (!next) {
        throw new Error("No delayed call queued");
      }
      next.callback();
    }
  };
}

describe("AnimationQueue", () => {
  it("runs queued commands by priority after current command finishes", () => {
    const { scene, runNextTimer } = createSceneStub();
    const queue = new AnimationQueue(scene as never);
    const runOrder: string[] = [];

    queue.enqueue({
      type: "swap",
      key: "swap-running",
      run: () => runOrder.push("swap")
    });
    queue.enqueue({
      type: "hit",
      key: "hit-pending",
      run: () => runOrder.push("hit")
    });
    queue.enqueue({
      type: "die",
      key: "die-pending",
      run: () => runOrder.push("die")
    });

    expect(runOrder).toEqual(["swap"]);

    runNextTimer();
    expect(runOrder).toEqual(["swap", "die"]);

    runNextTimer();
    expect(runOrder).toEqual(["swap", "die", "hit"]);
  });

  it("emits busy=true only for blocking animation types", () => {
    const { scene, runNextTimer } = createSceneStub();
    const queue = new AnimationQueue(scene as never);
    const busyEvents: boolean[] = [];
    queue.setBusyChangeListener((busy) => busyEvents.push(busy));

    queue.enqueue({
      type: "swap",
      key: "swap",
      run: () => {}
    });
    runNextTimer();

    queue.enqueue({
      type: "hit",
      key: "hit",
      run: () => {}
    });
    runNextTimer();

    expect(busyEvents).toEqual([false, false, true, false]);
  });
});
