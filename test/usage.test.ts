import { expect, describe, it } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { guard, enter, leave } from "../src/state-machine-hooks";
import { createSetup, setup } from "../src/ext/setup";

describe("setup", () => {
  it("should transition correctly", () => {
    const machine = createMachine(
      defineStates({
        Idle: undefined,
        Running: undefined,
      } as const),
      {
        Idle: {
          start: "Running",
        },
        Running: {
          stop: "Idle",
        },
      },
      "Idle"
    );
    setup(machine)(
      guard((ev) => true),
      leave((ev) => {
        // Hook for leaving state; logging removed
      }),
      enter((ev) => {
        // Hook for entering state; logging removed
      }),
      enter((value) => {})
    );
    expect(machine.getState().key).toBe("Idle");
    machine.send("start");
    expect(machine.getState().key).toBe("Running");
    machine.send("stop");
    expect(machine.getState().key).toBe("Idle");
  });
});

describe("createSetup", () => {
  it("should transition correctly", () => {
    const machine = createMachine(
      defineStates({
        Idle: undefined,
        Running: undefined,
      } as const),
      {
        Idle: {
          start: "Running",
        },
        Running: {
          stop: "Idle",
        },
      },
      "Idle"
    );

    createSetup<typeof machine>(
      guard((ev) => true),
      leave((ev) => {
        // Hook for leaving state; logging removed
      })
    )(machine);
    machine.send("start");
    expect(machine.getState().key).toBe("Running");
    machine.send("stop");
    expect(machine.getState().key).toBe("Idle");
  });
});

describe("factory-machine", () => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const create = () => {
    const states = defineStates({
      Idle: undefined,
      Pending: (x: number) => ({ s: `#${x}` }),
      Resolved: (ok: boolean) => ({ ok }),
      Rejected: (err: Error) => ({ err }),
    });

    const machine = createMachine(
      states,
      {
        Idle: { execute: "Pending" },
        Pending: { resolve: "Resolved", reject: "Rejected" },
        Resolved: {},
        Rejected: {},
      },
      states.Idle()
    );

    setup(machine)(
      guard((ev) => ev.type !== "execute" || ev.params[0] > 0),
      leave((ev) => {
        // Hook for leaving state; logging removed
      }),
      enter((ev) => {
        // Hook for entering state; logging removed
      })
    );
    return machine;
  };
  it("should transition through states when executed", () => {
    let machine = create();
    machine.send("execute", 1);
    expect(machine.getState().key).toBe("Pending");

    machine.send("resolve", true);
    expect(machine.getState().key).toBe("Resolved");

    expect(machine.getState().as("Resolved").data.ok).toBe(true);

    machine = create();
    machine.send("execute", 2);

    machine.send("reject", new Error("Some error"));
    expect(machine.getState().key).toBe("Rejected");
    expect(machine.getState().as("Rejected").data.err).toBeInstanceOf(Error);
    expect(machine.getState().as("Rejected").data.err.message).toBe(
      "Some error"
    );
  });
});
