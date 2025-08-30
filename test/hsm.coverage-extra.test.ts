import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../playground/propagateSubmachines";
import { submachine } from "../playground/submachine";

// 1) Explicit final-state should trigger child.exit
function createChildWithFinal() {
  const states = defineStates({
    Start: undefined,
    Final: () => ({ final: true as const, value: 1 }),
  });
  const transitions = {
    Start: { go: "Final" },
    Final: {},
  } as const;
  const m = createMachine(states, transitions, "Start");
  setup(m)(propagateSubmachines(m));
  return m;
}

// 2) Duck-typed send-only child should be treated as handled by childFirst
function createDuckSendOnly() {
  let called = 0;
  const child = {
    getState() {
      return { key: "Duck", data: {} } as any;
    },
    send(type: string, ..._params: any[]) {
      if (type === "pong") called++;
    },
    get called() {
      return called;
    },
  };
  return child;
}

// Helper to create a parent with child machine
function createParentWithChild(childFactory: () => any) {
  const states = defineStates({
    WithChild: submachine(childFactory, { id: "c1" }),
    Next: undefined,
  });
  const transitions = {
    WithChild: {
      "child.exit": () => states.Next(),
      noop: (ev: any) => states.WithChild(), // self-transition
    },
    Next: {},
  } as const;
  const m = createMachine(states, transitions, "WithChild");
  setup(m)(propagateSubmachines(m));
  return m;
}

// 4) Parent transition swaps child identity and wrappers should reapply
function createSwappingParent() {
  const mk = (label: string) => {
    const states = defineStates({ A: () => ({ label }) });
    const transitions = { A: {} } as const;
    const m = createMachine(states, transitions, "A");
    setup(m)(propagateSubmachines(m));
    return m;
  };
  const states = defineStates({
    S1: submachine(() => mk("one"), { id: "c1" }),
    S2: submachine(() => mk("two"), { id: "c1" }),
    Done: undefined,
  });
  const transitions = {
    S1: { swap: () => states.S2() },
    S2: { finish: () => states.Done() },
    Done: {},
  } as const;
  const m = createMachine(states, transitions, "S1");
  setup(m)(propagateSubmachines(m));
  return m;
}

describe("coverage extras", () => {
  it("explicit final triggers child.exit", () => {
    const parent = createParentWithChild(() => createChildWithFinal());
    const child = (parent as any).getState().as("WithChild").data.machine as any;
    expect((parent as any).getState().key).toBe("WithChild");
    child.send("go");
    expect((parent as any).getState().key).toBe("Next");
  });

  it("duck send-only is handled by child-first", () => {
    const parent = createParentWithChild(() => createDuckSendOnly() as any);
    const before = (parent as any).getState();
    const child = (parent as any).getState().as("WithChild").data.machine as any;
    expect(child.called).toBe(0);
    (parent as any).send("pong"); // should invoke child's send and be treated handled
    expect(child.called).toBe(1);
    // parent remains same state (no parent handler)
    expect((parent as any).getState()).toBe(before);
  });

  it("parent self-transition preserves identity via pre-resolve", () => {
    const parent = createParentWithChild(() => createChildWithFinal());
    const s1 = (parent as any).getState();
    (parent as any).send("noop"); // resolves to WithChild again
    const s2 = (parent as any).getState();
    expect(s2).toBe(s1); // identity preserved
  });

  it("child wrappers reapply after parent swap transition", () => {
    const parent = createSwappingParent();
    const s1 = (parent as any).getState();
    expect(s1.key).toBe("S1");
    // swap to S2 (child identity changes)
    (parent as any).send("swap");
    const s2 = (parent as any).getState();
    expect(s2.key).toBe("S2");
    const child2 = s2.as("S2").data.machine as any;
    // If wrappers re-applied, sending any event won't throw and state remains S2
    child2.send?.("noop");
    expect((parent as any).getState().key).toBe("S2");
  });
});
