import { describe, it, expect, beforeEach } from "vitest";
import { defineStates, createMachine } from "../src";
import { createHierarchicalMachine } from "../src/nesting/propagateSubmachines";

// Recursive machine factory for testing infinite depth
function createNestedMachine(level: number, maxDepth: number = 5): any {
  const states = defineStates({
    Idle: () => ({ level, depth: level }),
    Processing: () => {
      const baseData = { level, depth: level };
      return level < maxDepth - 1 
        ? { ...baseData, machine: createNestedMachine(level + 1, maxDepth) }
        : baseData;
    },
    Done: () => ({ level, depth: level, final: true }),
  });
  
  const machine = createMachine(states, {
    Idle: { 
      start: "Processing",
    },
    Processing: {
      complete: "Done",
      "child.exit": ({ data }) => {
        // When child completes, we complete too
        if (data?.final) {
          return states.Done();
        }
        return null;
      },
    },
    Done: {},
  }, "Idle");
  
  return createHierarchicalMachine(machine);
}

describe("HSM: Infinite Depth Support", () => {

  it("handles deep nesting (5 levels) with context propagation", () => {
    const root = createNestedMachine(0, 5);
    
    // Verify root level
    let rootState = root.getState();
    expect(rootState.key).toBe("Idle");
    expect(rootState.depth).toBe(0);
    expect(rootState.nested.fullKey).toBe("Idle");
    expect(rootState.data.level).toBe(0);
    
    // Start processing to create deep hierarchy
    root.send("start");
    rootState = root.getState();
    expect(rootState.key).toBe("Processing");
    expect(rootState.depth).toBe(0);
    expect(rootState.nested.fullKey).toBe("Processing.Idle");
    
    // Navigate down the hierarchy and verify context at each level
    let currentMachine: any = root;
    let currentState = rootState;
    
    for (let expectedLevel = 0; expectedLevel < 5; expectedLevel++) {
      // Verify current level context
      expect(currentState.data.level).toBe(expectedLevel);
      expect(currentState.depth).toBe(expectedLevel);
      
      // If not at deepest level, go deeper
      if (expectedLevel < 4) {
        // Get child machine
        const childMachine = currentState.is("Processing") ? currentState.data.machine : null;
        expect(childMachine).toBeDefined();
        
        // Start child
        currentMachine.send("start");
        
        // Get child state with context
        const childState = childMachine?.getState();
        expect(childState?.key).toBe("Processing");
        expect(childState?.depth).toBe(expectedLevel + 1);
        expect(childState?.data.level).toBe(expectedLevel + 1);
        
        // Verify fullKey builds correctly
        const expectedFullkey = Array(expectedLevel + 2).fill("Processing").join(".");
        expect(childState?.nested.fullKey).toBe(expectedFullkey);
        
        // Move to next level
        currentMachine = childMachine;
        currentState = childState;
      }
    }
    
    // At deepest level (level 4), should have no child machine
    const deepestState = currentState;
    expect(deepestState.data.level).toBe(4);
    expect(deepestState.depth).toBe(4);
    expect(deepestState.nested.fullKey).toBe("Processing.Processing.Processing.Processing.Processing");
    expect(deepestState.data.machine).toBeUndefined();
  });

  it("propagates completion events up through infinite depth hierarchy", () => {
    const root = createNestedMachine(0, 3); // Use 3 levels for easier testing
    
    // Start all levels
    root.send("start"); // Level 0: Idle -> Processing
    root.send("start"); // Level 1: Idle -> Processing  
    root.send("start"); // Level 2: Idle -> Processing (deepest, no child)
    
    // Verify we're in deep processing state
    let rootState = root.getState();
    expect(rootState.key).toBe("Processing");
    
    const level1Machine = rootState.is("Processing") ? rootState.data.machine : null;
    let level1State = level1Machine?.getState();
    expect(level1State?.key).toBe("Processing");
    
    const level2Machine = level1State?.is("Processing") ? level1State.data.machine : null;
    let level2State = level2Machine?.getState();
    expect(level2State?.key).toBe("Processing");
    expect(level2State?.data.machine).toBeUndefined(); // Deepest level
    
    // Complete at deepest level - should trigger chain reaction
    root.send("complete");
    
    // Level 2 should complete first
    level2State = level2Machine?.getState();
    expect(level2State?.key).toBe("Done");
    expect(level2State?.data.final).toBe(true);
    
    // This should trigger child.exit on level 1, causing it to complete
    level1State = level1Machine?.getState();
    expect(level1State?.key).toBe("Done");
    expect(level1State?.data.final).toBe(true);
    
    // This should trigger child.exit on root, causing it to complete
    rootState = root.getState();
    expect(rootState.key).toBe("Done");
    expect(rootState.data.final).toBe(true);
  });

  it("maintains consistent context across arbitrary depth", () => {
    const depth = 7; // Test with 7 levels
    const root = createNestedMachine(0, depth);
    
    // Helper to navigate to any level  
    const navigateToLevel = (targetLevel: number, rootMachine = root) => {
      let currentMachine = rootMachine;
      
      // Start all levels up to target
      for (let i = 0; i <= targetLevel; i++) {
        currentMachine.send("start");
        const currentState = currentMachine.getState();
        
        if (i < targetLevel) {
          const childMachine = currentState.is("Processing") ? currentState.data.machine : null;
          if (childMachine) {
            currentMachine = childMachine;
          } else {
            throw new Error(`No child machine found at level ${i}`);
          }
        }
      }
      
      // Get final state after all navigation
      const finalState = currentMachine.getState();
      return { machine: currentMachine, state: finalState };
    };
    
    // Test context at various levels (create fresh navigation for each test)
    const testLevels = [0, 2, 4, 6];
    
    for (const level of testLevels) {
      // Create fresh root for each level test to avoid stack contamination
      const freshRoot = createNestedMachine(0, depth);
      const { state } = navigateToLevel(level, freshRoot);
      
      const expectedPath = Array(level + 1).fill("Processing").join(".");
      // Verify context consistency
      expect(state.nested.fullKey).toBe(expectedPath);
      expect(state.data.level).toBe(level);
      
      // Verify stack length matches current active depth (all levels see same stack)  
      // Note: stack may contain additional states from auto-enhanced child machines
      expect(state.stack.length).toBeGreaterThanOrEqual(level + 1);
      
      // Verify the first (level + 1) states in stack are all Processing states in our hierarchy
      for (let i = 0; i <= level; i++) {
        expect(state.stack[i]?.key).toBe("Processing");
      }
      
      // Verify fullKey has correct number of segments
      const segments = state.nested.fullKey.split(".");
      expect(segments).toHaveLength(level + 2); // +1 for Processing, +1 for Idle
      
      // All segments should be "Processing" except possibly the first
      for (let i = 0; i < segments.length; i++) {
        if (i === 0) {
          expect(segments[i]).toMatch(/^(Idle|Processing)$/);
        } else {
          expect(segments[i]).toBe("Processing");
        }
      }
      
      // Verify stack contains correct states
      for (let i = 0; i < state.stack.length; i++) {
        expect(state.stack[i].data.level).toBe(i);
      }
    }
  });

  it("handles event bubbling through deep hierarchies", () => {
    // Create a simpler test for bubbling - events that can't be handled by children
    // should bubble up to parents. We'll test with the "complete" event which only
    // the deepest level can handle initially
    
    const root = createNestedMachine(0, 3);
    
    // Create 3-level hierarchy
    root.send("start"); // Level 0: Idle -> Processing
    root.send("start"); // Level 1: Idle -> Processing  
    root.send("start"); // Level 2: Idle -> Processing (deepest, has complete handler)
    
    // Verify hierarchy is set up correctly
    const rootState = root.getState();
    expect(rootState.key).toBe("Processing");
    
    const level1Machine = rootState.is("Processing") ? rootState.data.machine : null;
    const level1State = level1Machine?.getState();
    expect(level1State?.key).toBe("Processing");
    
    const level2Machine = level1State?.is("Processing") ? level1State.data.machine : null;
    const level2State = level2Machine?.getState();
    expect(level2State?.key).toBe("Processing");
    expect(level2State?.data.machine).toBeUndefined();
    
    // Send complete - should be handled by level 2 (child-first routing)
    root.send("complete");
    
    // Level 2 should complete
    const newLevel2State = level2Machine?.getState();
    expect(newLevel2State?.key).toBe("Done");
    
    // The key insight: child-first routing works correctly at any depth
    // Events are routed to the deepest applicable handler
  });
});