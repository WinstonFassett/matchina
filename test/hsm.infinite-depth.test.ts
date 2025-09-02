import { describe, it, expect } from "vitest";
import { defineStates, createMachine } from "../src";
import { createHierarchicalMachine } from "../src/nesting/propagateSubmachines";

const MAX_DEPTH = 3;

// A machine that can be nested within itself.
function createNestingMachine(level = 0) {
  const states = defineStates({
    Idle: () => ({ level }),
    Processing: () => {
      if (level < MAX_DEPTH) {
        // Create a child machine one level deeper
        return { machine: createHierarchicalMachine(createNestingMachine(level + 1)), level };
      }
      // At max depth, don't create a child
      return { level };
    },
    Done: () => ({ level, final: true }),
  });

  const machine = createMachine(states, {
    Idle: {
      PROCESS: "Processing",
    },
    Processing: {
      // When a child machine exits, this machine transitions to Done.
      "child.exit": ({ data }) => {
        if (data.final) {
          return states.Done();
        }
        return null;
      },
      FINISH: "Done",
    },
    Done: {},
  }, "Idle");

  return machine;
}

describe("HSM: Infinite Depth Simulation", () => {
  it("should allow machines to be nested recursively", () => {
    const root = createHierarchicalMachine(createNestingMachine(0));

    expect(root.getState().key).toBe("Idle");
    expect(root.getState().nested.fullKey).toBe("Idle");

    // Go deeper
    root.send("PROCESS");
    expect(root.getState().key).toBe("Processing");
    expect(root.getState().nested.fullKey).toBe("Processing.Idle");

    // Go deeper again
    root.send("PROCESS");
    expect(root.getState().nested.fullKey).toBe("Processing.Processing.Idle");

    // Go to max depth
    root.send("PROCESS");
    expect(root.getState().nested.fullKey).toBe("Processing.Processing.Processing.Idle");

    // At max depth, the deepest machine is in 'Processing' but has no child.
    root.send("PROCESS");
    expect(root.getState().nested.fullKey).toBe("Processing.Processing.Processing.Processing");
  });

  it("should propagate 'child.exit' up the chain", () => {
    const root = createHierarchicalMachine(createNestingMachine(0));

    // Go to max depth
    root.send("PROCESS"); // level 1
    root.send("PROCESS"); // level 2
    root.send("PROCESS"); // level 3
    root.send("PROCESS"); // level 4 (max depth, no child)

    expect(root.getState().nested.fullKey).toBe("Processing.Processing.Processing.Processing");

    // Send FINISH to the deepest machine. It should transition to Done,
    // which is a final state, triggering a chain reaction of 'child.exit' events.
    root.send("FINISH");

    // The entire hierarchy should unwind to the root's Done state.
    expect(root.getState().key).toBe("Done");
    expect(root.getState().nested.fullKey).toBe("Done");
  });
});
