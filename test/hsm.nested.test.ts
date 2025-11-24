import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../playground/propagateSubmachines";
import type { FactoryMachine } from "../src/factory-machine";

function createChild() {
  const states = defineStates({
    Idle: undefined,
    Executing: undefined,
  });
  return createMachine(
    states,
    {
      Idle: { start: "Executing" },
      Executing: {},
    },
    "Idle"
  );
}

function createParent() {
  const states = defineStates({
    Idle: undefined,
    First: () => ({ machine: createChild() }),
    Done: undefined,
  });
  const m = createMachine(
    states,
    {
      Idle: { toFirst: "First" },
      First: { done: "Done" },
      Done: {},
    },
    "Idle"
  );
  setup(m)(propagateSubmachines(m));
  return m;
}

describe("HSM: state has a machine (child-first)", () => {
  it("creates child machine when entering First", () => {
    const parent = createParent();
    expect(parent.getState().key).toBe("Idle");
    parent.send("toFirst");
    const s = parent.getState().as("First");
    expect(s.key).toBe("First");
    // @ts-ignore
    expect(s.data?.machine).toBeTruthy();
  });

  it("routes start to child first and keeps parent in First", () => {
    const parent = createParent();
    parent.send("toFirst");
    const before = parent.getState().as("First");
    const child = (before as any).data.machine as FactoryMachine<any>;
    expect(child.getState().key).toBe("Idle");

    parent.send("start" as any);

    expect(parent.getState().key).toBe("First");
    const afterChild = parent.getState().as("First").data.machine as FactoryMachine<any>;
    expect(afterChild.getState().key).toBe("Executing");
  });

  it("bubbles to parent when child cannot handle", () => {
    const parent = createParent();
    parent.send("toFirst");
    parent.send("done" as any);
    expect(parent.getState().key).toBe("Done");
  });
});
