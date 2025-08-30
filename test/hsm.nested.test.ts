import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { createHierarchicalMachine } from "../src/nesting/propagateSubmachines";
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
  return createHierarchicalMachine(m);
}

describe("HSM: state has a machine (child-first)", () => {
  it("creates child machine when entering First", () => {
    const parent = createParent();
    expect(parent.getState().key).toBe("Idle");
    parent.send("toFirst");
    const s = parent.getState();
    expect(s.key).toBe("First");
    expect(s.is("First") && s.data.machine ? true : false).toBe(true);
  });

  it("routes start to child first and keeps parent in First", () => {
    const parent = createParent();
    parent.send("toFirst");
    const state = parent.getState();
    expect(state.is("First")).toBe(true);
    const child = state.is("First") ? state.data.machine : undefined;
    expect(child?.getState().key).toBe("Idle");

    parent.send("start");

    expect(parent.getState().key).toBe("First");
    const afterState = parent.getState();
    const afterChild = afterState.is("First") ? afterState.data.machine : undefined;
    expect(afterChild?.getState().key).toBe("Executing");
  });

  it("bubbles to parent when child cannot handle", () => {
    const parent = createParent();
    parent.send("toFirst");
    parent.send("done");
    expect(parent.getState().key).toBe("Done");
  });
});
