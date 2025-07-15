import { describe, expect, it, vi } from "vitest";
import { createMachine, defineStates, withApi } from "../src";
import { withNanoSubscribe } from "../src/extras/with-nanosubscribe";
// import { whenEvent } from "../src/factory-machine-hooks";

describe("withSubscribe", () => {
  it("adds subscribe, when, and dispose methods to the machine", () => {
    const states = defineStates({
      Idle: {},
      Running: {},
    });

    const inner = createMachine(
      states,
      {
        Idle: {
          start: states.Running,
        },
        Running: {
          stop: states.Idle,
        },
      },
      "Idle",
    );
    const e = withApi(inner);

    const machine = withNanoSubscribe(inner);
    expect(machine.subscribe).toBeDefined();
    // expect(machine.when).toBeDefined();
    // expect(machine.dispose).toBeDefined();
  });

  it("emits state changes to subscribers", () => {
    const states = defineStates({
      Idle: {},
      Running: {},
    });
    const machine = withNanoSubscribe(
      createMachine(
        states,
        {
          Idle: {
            start: states.Running,
          },
          Running: {
            stop: states.Idle,
          },
        },
        "Idle",
      ),
    );
    const subscriber = vi.fn();
    const subscription = machine.subscribe(subscriber);
    machine.send("start");
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  // it("allows subscribing to specific event types", () => {
  //   const states = defineStates({
  //     Idle: {},
  //     Running: {},
  //   });
  //   const machine = withNanoSubscribe(
  //     createMachine(
  //       states,
  //       {
  //         Idle: {
  //           start: states.Running,
  //         },
  //         Running: {
  //           stop: states.Idle,
  //         },
  //       },
  //       "Idle",
  //     ),
  //   );

  //   const subscriber = vi.fn();
  //   const subscription = machine.subscribe(
  //     whenEvent({ type: "start" }, subscriber),
  //   );
  //   machine.send("stop");
  //   machine.send("start");
  //   expect(subscriber).toHaveBeenCalledTimes(1);
  //   // expect(machine.dispose).toBeDefined();
  // });

  // it("allows subscribing to specific from/to states", () => {
  //   const states = defineStates({
  //     Idle: {},
  //     Running: {},
  //   });
  //   const machine = withNanoSubscribe(
  //     createMachine(
  //       states,
  //       {
  //         Idle: {
  //           start: states.Running,
  //         },
  //         Running: {
  //           stop: states.Idle,
  //         },
  //       },
  //       "Idle",
  //     ),
  //   );
  //   const subscriber = vi.fn();
  //   type X = ReturnType<typeof machine.getChange>;

  //   const subscription = machine.subscribe((ev) => {
  //     whenEvent<X>({ from: "Idle", to: "Running" }, subscriber)(ev);
  //   });
  //   machine.send("stop");
  //   machine.send("start");
  //   expect(subscriber).toHaveBeenCalledTimes(1);
  //   // expect(machine.dispose).toBeDefined();
  // });

  // it("allows subscribing to specific from/to states and event types", () => {
  //   const states = defineStates({
  //     Idle: {},
  //     Running: {},
  //   });
  //   const machine = withNanoSubscribe(
  //     createMachine(
  //       states,
  //       {
  //         Idle: {
  //           start: states.Running,
  //         },
  //         Running: {
  //           stop: states.Idle,
  //         },
  //       },
  //       "Idle",
  //     ),
  //   );
  //   const subscriber = vi.fn();
  //   const subscription = machine.subscribe(
  //     whenEvent<ReturnType<typeof machine.getChange>>(
  //       {
  //         from: "Idle",
  //         to: "Running",
  //         type: "start",
  //       },
  //       subscriber,
  //     ),
  //   );
  //   machine.send("stop");
  //   machine.send("start");
  //   expect(subscriber).toHaveBeenCalledTimes(1);
  //   // expect(machine.dispose).toBeDefined();
  // });

  it("allows disposing of a subscription", () => {
    const states = defineStates({
      Idle: {},
      Running: {},
    });
    const machine = withNanoSubscribe(
      createMachine(
        states,
        {
          Idle: {
            start: states.Running,
          },
          Running: {
            stop: states.Idle,
          },
        },
        "Idle",
      ),
    );

    const subscriber = vi.fn();
    const unsub = machine.subscribe(subscriber);
    machine.send("start");
    expect(subscriber).toHaveBeenCalledTimes(1);
    // expect(machine.dispose).toBeDefined();
    unsub();
    machine.send("stop");
    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});
