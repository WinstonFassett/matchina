import { describe, it, expect, vi } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine, resolveNextState } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { enter, leave } from "../src/state-machine-hooks";
import type { FactoryMachine } from "../src/factory-machine";
import { propagateSubmachines } from "./propagateSubmachines";

// Minimal child machine used in tests
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

// Parent machine factory creating a state that HAS a machine at data.machine
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
  expect(parent.getState().key).toBe("Idle");
  parent.send("toFirst");
  const state = parent.getState();
  expect(state.key).toBe("First");
  // @ts-ignore
  expect(!!state.data?.machine).not.toBeUndefined();
})();

// Test 2: child-first handling keeps parent in First when child handles 'start'
(function test_child_first_handling() {
  const parent = createParent();


  parent.send("toFirst");
  const beforeParent = parent.getState();
  // @ts-ignore
  const child = beforeParent.data.machine as FactoryMachine<any>;
  expect(child.getState().key).toBe("Idle");

  // Send event to parent; routing should send to child first
  parent.send("start" as any);
  expect(parent.getState().key).toBe("First");
  expect(parent.getState().as("First").data.machine.getState().key).toBe("Executing");
})();

// Test 3: bubble to parent when child does not handle 'done'
(function test_bubble_to_parent() {
  const parent = createParent();
  parent.send("toFirst");
  // Child has no 'done' transition; parent First: { done: 'Done' }
  parent.send("done" as any);
  const state = parent.getState();
  expect(
    state.key === "Done",
    "parent should transition to Done when child does not handle"
  );
})();
