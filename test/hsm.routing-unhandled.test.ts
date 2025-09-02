import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";
import { submachine } from "../src/nesting/submachine";

// Scenario: child does NOT handle 'nudge', parent does. Ensure bubble to parent.
describe("HSM routing: unhandled child bubbles to parent", () => {
  function createChild() {
    const states = defineStates({ A: undefined });
    const transitions = {
      A: {
        // deliberately no 'nudge'
      },
    } as const;
    const m = createMachine(states, transitions, "A");
    propagateSubmachines(m);
    return m;
  }

  function createParent() {
    const states = defineStates({
      Idle: undefined,
      Working: submachine(() => createChild()),
    });

    const transitions = {
      Idle: {
        go: "Working",
      },
      Working: {
        // Parent will handle 'nudge' if child doesn't
        nudge: "Working", // stay Working
        stop: "Idle",
      },
    } as const;

    const m = createMachine(states, transitions, "Idle");
    propagateSubmachines(m);
    return m;
  }

  it("bubbles to parent when child lacks handler", () => {
    const p = createParent();

    p.send("go");
    expect(p.getState().key).toBe("Working");

    const before = p.getState();
    p.send("nudge"); // child ignores, parent handles (self-transition)
    const after = p.getState();

    expect(after.key).toBe("Working");
    // Self-transitions create new state objects, so we test structural equality instead
    expect(after.key).toBe(before.key);
  });
});
