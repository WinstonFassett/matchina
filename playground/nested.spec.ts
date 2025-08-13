import { createMachine, resolveNextState } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { enter, leave } from "../src/state-machine-hooks";
import type { FactoryMachine } from "../src/factory-machine";
import { propagateSubmachines } from "./propagateSubmachines";

// Tiny assertion helpers
action: {
}
function expect(cond: any, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

// Minimal child machine used in tests
function createChild() {
  const states = {
    Idle: () => ({ key: "Idle" }),
    Executing: () => ({ key: "Executing" }),
  } as const;
  const transitions = {
    Idle: { start: "Executing" },
    Executing: {},
  } as const;
  return createMachine(states, transitions, "Idle");
}

// Parent machine factory creating a state that HAS a machine at data.machine
function createParent() {
  const states = {
    Idle: () => ({ key: "Idle" }),
    First: () => ({ key: "First", data: { machine: createChild() } }),
    Done: () => ({ key: "Done" }),
  } as const;
  const transitions = {
    Idle: { toFirst: "First" },
    First: { done: "Done" },
    Done: {},
  } as const;
  const m = createMachine(states, transitions, "Idle");
  // Wire child-first routing for hierarchy
  setup(m)(propagateSubmachines(m));
  // Optional hooks to model teardown
  setup(m)(
    leave((ev) => {
      if (ev.from.key === "First") {
        // user could call dispose on child here if it exposes it
      }
      return ev;
    }),
    enter((ev) => ev)
  );
  return m;
}

// Test 1: creates child in state when transitioning to First
(function test_child_created() {
  const parent = createParent();
  parent.send("toFirst");
  const state = parent.getState();
  expect(state.key === "First", "parent should be in First state");
  // @ts-ignore
  expect(!!state.data?.machine, "child machine should exist on state.data.machine");
})();

// Test 2: child-first handling keeps parent in First when child handles 'start'
(function test_child_first_handling() {
  const parent = createParent();
  parent.send("toFirst");
  const beforeParent = parent.getState();
  // @ts-ignore
  const child = beforeParent.data.machine as FactoryMachine<any>;
  expect(child.getState().key === "Idle", "child starts Idle");

  // Send event to parent; routing should send to child first
  parent.send("start" as any);

  const afterParent = parent.getState();
  expect(afterParent.key === "First", "parent should remain in First when child handled");
  // @ts-ignore
  expect(afterParent.data.machine.getState().key === "Executing", "child should transition to Executing");
})();

// Test 3: bubble to parent when child does not handle 'done'
(function test_bubble_to_parent() {
  const parent = createParent();
  parent.send("toFirst");
  // Child has no 'done' transition; parent First: { done: 'Done' }
  parent.send("done" as any);
  const state = parent.getState();
  expect(state.key === "Done", "parent should transition to Done when child does not handle");
})();
