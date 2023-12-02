import { describe, expect, it, vi } from "vitest";
import { defineStates } from "../src/states";
import { defineMachine } from "../src/dev/v1/machine";
import { withSubscribe } from "../src/dev/v1/extras/with-subscribe";
import { withEvents } from "../src/dev/v1";

describe("withSubscribe", () => {
  it("adds subscribe, when, and dispose methods to the machine", () => {
    const states = defineStates({
      Idle: {},
      Running: {},
    });

    const inner = defineMachine(states, {
      Idle: {
        start: states.Running,
      },
      Running: {
        stop: states.Idle,
      },
    }).create(states.Idle());
    const e = withEvents(inner);

    const machine = withSubscribe(inner);
    expect(machine.subscribe).toBeDefined();
    expect(machine.when).toBeDefined();
    expect(machine.dispose).toBeDefined();
  });

  it("emits state changes to subscribers", () => {
    const states = defineStates({
      Idle: {},
      Running: {},
    });
    const machine = withSubscribe(
      defineMachine(states, {
        Idle: {
          start: states.Running,
        },
        Running: {
          stop: states.Idle,
        },
      }).create(states.Idle()),
    );
    const subscriber = vi.fn();
    const subscription = machine.subscribe(subscriber);
    machine.send("start");
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(machine.dispose).toBeDefined();
  });

  it("allows subscribing to specific event types", () => {
    const states = defineStates({
      Idle: {},
      Running: {},
    });
    const machine = withSubscribe(
      defineMachine(states, {
        Idle: {
          start: states.Running,
        },
        Running: {
          stop: states.Idle,
        },
      }).create(states.Idle()),
    );

    const subscriber = vi.fn();
    const subscription = machine.when({ type: "start" }, subscriber);
    machine.send("stop");
    machine.send("start");
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(machine.dispose).toBeDefined();
  });

  it("allows subscribing to specific from/to states", () => {
    const states = defineStates({
      Idle: {},
      Running: {},
    });
    const machine = withSubscribe(
      defineMachine(states, {
        Idle: {
          start: states.Running,
        },
        Running: {
          stop: states.Idle,
        },
      }).create(states.Idle()),
    );
    const subscriber = vi.fn();
    const subscription = machine.when(
      { from: "Idle", to: "Running" },
      subscriber,
    );
    machine.send("stop");
    machine.send("start");
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(machine.dispose).toBeDefined();
  });

  it("allows subscribing to specific from/to states and event types", () => {
    const states = defineStates({
      Idle: {},
      Running: {},
    });
    const machine = withSubscribe(
      defineMachine(states, {
        Idle: {
          start: states.Running,
        },
        Running: {
          stop: states.Idle,
        },
      }).create(states.Idle()),
    );
    const subscriber = vi.fn();
    const subscription = machine.when(
      { from: "Idle", to: "Running", type: "start" },
      subscriber,
    );
    machine.send("stop");
    machine.send("start");
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(machine.dispose).toBeDefined();
  });

  it("allows disposing of a subscription", () => {
    const states = defineStates({
      Idle: {},
      Running: {},
    });
    const machine = withSubscribe(
      defineMachine(states, {
        Idle: {
          start: states.Running,
        },
        Running: {
          stop: states.Idle,
        },
      }).create(states.Idle()),
    );

    const subscriber = vi.fn();
    const unsub = machine.subscribe(subscriber);
    machine.send("start");
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(machine.dispose).toBeDefined();
    unsub();
    machine.send("stop");
    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});
