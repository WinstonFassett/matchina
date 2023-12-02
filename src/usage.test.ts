import { defineStates } from "./states";
import { createFactoryMachine } from "./factory-machine";
import { guard, enter, leave } from "./machine-setup";
import { createSetup, setup } from "./setup";
import { createStateMachine } from "./state-machine";
import { expect, describe, it } from "vitest";

describe("setup", () => {
  it("should transition correctly", () => {
    const machine = createStateMachine(
      {
        Idle: {
          start: { key: "Running" },
        },
        Running: {
          stop: { key: "Idle" },
        },
      },
      { key: "Idle", data: undefined },
    );

    setup(machine)(
      guard((ev) => true),
      leave((ev) => console.log("leave", ev.type)),
      enter((ev) => console.log("enter", ev.type)),
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
    const machine = createStateMachine(
      {
        Idle: {
          start: { key: "Running" },
        },
        Running: {
          stop: { key: "Idle" },
        },
      },
      { key: "Idle", data: undefined } as {
        key: "Idle" | "Pending" | "Done";
        data: undefined;
      },
    );

    createSetup<typeof machine>(
      guard((ev) => true),
      leave((ev) => console.log("leave", ev.type)),
    )(machine);
    machine.send("start");
    expect(machine.getState().key).toBe("Running");
    machine.send("stop");
    expect(machine.getState().key).toBe("Idle");
  });
});

describe("factory-machine", () => {
  const create = () => {
    const states = defineStates({
      Idle: undefined,
      Pending: (x: number) => ({ s: `#${x}` }),
      Resolved: (ok: boolean) => ({ ok }),
      Rejected: (err: Error) => ({ err }),
    });

    const machine = createFactoryMachine(
      states,
      {
        Idle: { execute: "Pending" },
        Pending: { resolve: "Resolved", reject: "Rejected" },
        Resolved: {},
        Rejected: {},
      },
      states.Idle(),
    );

    setup(machine)(
      guard((ev) => ev.type !== "execute" || ev.params[0] > 0),
      leave((ev) => {
        if (ev.type == "execute") {
          console.log("executing");
        }
      }),
      enter((ev) =>
        console.log(
          ev.type,
          ev.to.match<any>({
            Pending: (ev) => ev.s,
            Resolved: (ev) => ev.ok,
            Rejected: (ev) => ev.err.message,
            _: () => false,
          }),
        ),
      ),
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
      "Some error",
    );
  });
});
