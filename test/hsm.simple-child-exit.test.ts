import { describe, it, expect, vi } from "vitest";
import { defineStates, createMachine, effect } from "../src";
import { createHierarchicalMachine } from "../src/nesting/propagateSubmachines";

describe("Simple child.exit test", () => {
  it("should synthesize child.exit when child reaches final state", () => {
    // Simple child machine that can go final
    const childStates = defineStates({
      Working: () => ({}),
      Done: () => ({ final: true }),
    });
    
    const childMachine = createMachine(childStates, {
      Working: { finish: "Done" },
    }, "Working");

    // Parent machine with child
    const parentStates = defineStates({
      Active: () => ({ machine: childMachine, id: "child" }),
      Complete: () => ({}),
    });

    const parentMachine = createMachine(parentStates, {
      Active: { "child.exit": "Complete" },
    }, "Active");

    const root = createHierarchicalMachine(parentMachine);
    
    // Subscribe to root changes
    const rootCalls = vi.fn();
    const unsub = effect(rootCalls)(root);
    
    console.log("=== Initial state ===");
    console.log("Root state:", root.getState().key);
    console.log("Child state:", childMachine.getState().key);
    
    const beforeFinish = rootCalls.mock.calls.length;
    
    console.log("=== Sending finish to child ===");
    childMachine.send("finish");
    
    console.log("=== After finish ===");
    console.log("Root state:", root.getState().key);
    console.log("Child state:", childMachine.getState().key);
    console.log("Child final?", childMachine.getState().data?.final);
    
    // Child should be Done
    expect(childMachine.getState().key).toBe("Done");
    expect(childMachine.getState().data?.final).toBe(true);
    
    // Parent should transition to Complete via child.exit
    expect(root.getState().key).toBe("Complete");
    expect(rootCalls.mock.calls.length).toBe(beforeFinish + 1);
    
    unsub();
  });
});
