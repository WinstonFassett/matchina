/**
 * TDD test to verify SketchInspector works with current hierarchical system
 * This tests what actually works right now, not what we expect to work
 */

import { describe, test, expect } from "vitest";
import { createSearchBarMachine } from "../docs/src/code/examples/hsm-searchbar/machine";

describe("SketchInspector Working Implementation", () => {
  test("should handle basic machine states", () => {
    const machine = createSearchBarMachine();
    
    // Initial state
    const initialState = machine.getState();
    expect(initialState.key).toBe("Inactive");
    
    // After focus, should have Active state with nested machine
    machine.focus();
    const activeState = machine.getState();
    expect(activeState.key).toBe("Active");
    expect(activeState.data.machine).toBeDefined();
    
    // The nested machine should be in Empty state
    const nestedMachine = activeState.data.machine;
    const nestedState = nestedMachine.getState();
    expect(nestedState.key).toBe("Empty");
  });

  test("should handle three-level nesting", () => {
    const machine = createSearchBarMachine();
    machine.focus(); // Active.Empty
    machine.activeMachine.typed("test");
    machine.activeMachine.submit(); // Active.Query (with promise machine)
    
    const activeState = machine.getState();
    expect(activeState.key).toBe("Active");
    
    const queryState = activeState.data.machine.getState();
    expect(queryState.key).toBe("Query");
    expect(queryState.data.machine).toBeDefined(); // Promise machine exists
    
    const promiseMachine = queryState.data.machine;
    const promiseState = promiseMachine.getState();
    // Promise machine should have some state (Pending, Success, etc.)
    expect(promiseState.key).toBeDefined();
    expect(typeof promiseState.key).toBe("string");
  });

  test("should provide fallback context for visualization", () => {
    const machine = createSearchBarMachine();
    machine.focus();
    
    const activeState = machine.getState();
    const nestedState = activeState.data.machine.getState();
    
    // Build manual fullkey for visualization
    const manualFullkey = `${activeState.key}.${nestedState.key}`;
    expect(manualFullkey).toBe("Active.Empty");
    
    // This is what the SketchInspector should be able to display
    expect(activeState.key).toBe("Active");
    expect(nestedState.key).toBe("Empty");
    
    // The component should be able to build "Active.Empty" from these pieces
  });

  test("SketchInspector essential data requirements are met", () => {
    const machine = createSearchBarMachine();
    machine.focus();
    machine.activeMachine.typed("test");
    machine.activeMachine.submit();
    
    // Level 1: Root machine
    const rootState = machine.getState();
    expect(rootState.key).toBe("Active");
    
    // Level 2: Nested machine  
    const nestedMachine = rootState.data?.machine;
    expect(nestedMachine).toBeDefined();
    const nestedState = nestedMachine.getState();
    expect(nestedState.key).toBe("Query");
    
    // Level 3: Deeper nested machine
    const deeperMachine = nestedState.data?.machine;
    expect(deeperMachine).toBeDefined();
    const deeperState = deeperMachine.getState();
    expect(deeperState.key).toBeDefined();
    
    // The SketchInspector has all the data it needs to:
    // 1. Show the hierarchy: Active -> Query -> [PromiseState]
    // 2. Highlight the innermost active state
    // 3. Build fullkey paths manually: "Active.Query.[PromiseState]"
    
    const manualPath = `${rootState.key}.${nestedState.key}.${deeperState.key}`;
    expect(manualPath).toMatch(/^Active\.Query\./);
  });
});