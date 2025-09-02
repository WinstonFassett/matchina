/**
 * TDD tests for SketchInspector with hierarchical machines
 * 
 * Tests the core expectation that hierarchical machines provide the necessary
 * context (fullKey, depth, stack) for visualization without needing extraction.
 */

import { describe, test, expect, beforeEach } from "vitest";
import { createSearchBarMachine } from "../docs/src/code/examples/hsm-searchbar/machine";

describe("SketchInspector Context Requirements", () => {
  beforeEach(() => {
    // No global state to reset - each machine manages its own hierarchy
  });

  test("hierarchical machine should provide fullKey context", () => {
    const machine = createSearchBarMachine();
    const initialState = machine.getState();
    
    // Initial state should be Inactive
    expect(initialState.key).toBe("Inactive");
    
    // When we activate, we should get hierarchical context
    machine.focus(); // Transition to Active.Empty
    const activeState = machine.getState();
    
    expect(activeState.key).toBe("Active");
    expect(activeState.data.machine).toBeDefined();
    
    // The nested machine should also have context
    const nestedMachine = activeState.data.machine;
    const nestedState = nestedMachine.getState();
    expect(nestedState.key).toBe("Empty");
    
    // This is what we expect from our hierarchical context system:
    // - fullKey should show the full path
    // - depth should indicate nesting level  
    // - stack should show the hierarchy
    
    expect(nestedState.nested.fullKey).toBeDefined();
    expect(nestedState.nested.fullKey).toContain("Active");
    expect(nestedState.nested.fullKey).toContain("Empty");
    
    expect(nestedState.depth).toBeDefined();
    expect(typeof nestedState.depth).toBe("number");
    expect(nestedState.depth).toBeGreaterThanOrEqual(0);
    
    expect(nestedState.stack).toBeDefined();
    expect(Array.isArray(nestedState.stack)).toBe(true);
    expect(nestedState.stack.length).toBeGreaterThan(0);
  });

  test("should identify innermost active state correctly", () => {
    const machine = createSearchBarMachine();
    machine.focus(); // Active.Empty
    
    const activeState = machine.getState();
    const nestedState = activeState.data.machine.getState();
    
    // The key insight: innermost active state has depth === stack.length - 1
    expect(nestedState.depth).toBeDefined();
    expect(nestedState.stack).toBeDefined();
    
    const isInnermostActive = nestedState.depth === (nestedState.stack.length - 1);
    
    // This should be true for the deepest active state
    expect(typeof isInnermostActive).toBe("boolean");
    
    // In a 2-level hierarchy (App.Active.Empty), the Empty state should be innermost
    expect(isInnermostActive).toBe(true);
  });

  test("should handle deeper nesting with Query state", () => {
    const machine = createSearchBarMachine();
    machine.focus(); // Active.Empty
    machine.activeMachine.typed("test");
    machine.activeMachine.submit(); // Active.Query (with promise machine)
    
    const activeState = machine.getState();
    const queryState = activeState.data.machine.getState();
    
    expect(queryState.key).toBe("Query");
    expect(queryState.data.machine).toBeDefined(); // Promise machine
    
    // The promise machine should also have hierarchical context
    const promiseMachine = queryState.data.machine;
    const promiseState = promiseMachine.getState();
    
    // This is a 3-level hierarchy: App.Active.Query.PromiseState
    expect(promiseState.fullKey).toBeDefined();
    expect(promiseState.fullKey).toContain("Active");
    expect(promiseState.fullKey).toContain("Query");
    
    expect(promiseState.depth).toBeDefined();
    expect(promiseState.stack).toBeDefined();
    
    const isInnermostActive = promiseState.depth === (promiseState.stack.length - 1);
    expect(isInnermostActive).toBe(true); // Should be the deepest active state
  });

  test("should work without hierarchical context (fallback)", () => {
    const machine = createSearchBarMachine();
    const initialState = machine.getState();
    
    // Even if hierarchical context is missing, basic properties should work
    expect(initialState.key).toBe("Inactive");
    
    // Fallback logic should handle missing context gracefully
    const fullKey = initialState.fullKey || initialState.key;
    const depth = initialState.depth ?? 0;
    
    expect(fullKey).toBe("Inactive");
    expect(depth).toBe(0);
    
    // Stack-based logic should handle missing stack
    const stack = initialState.stack || [];
    const isInnermostActive = depth === (stack.length - 1) || stack.length === 0;
    
    expect(typeof isInnermostActive).toBe("boolean");
  });
});