/**
 * Debug test to understand what hierarchical context we're actually getting
 */

import { describe, test, expect } from "vitest";
import { createSearchBarMachine } from "../docs/src/code/examples/hsm-searchbar/machine";

describe("Debug Hierarchical Context", () => {
  test("debug what context properties exist", () => {
    const machine = createSearchBarMachine();
    
    console.log("=== INITIAL STATE ===");
    const initialState = machine.getState();
    console.log("Initial state key:", initialState.key);
    console.log("Initial state fullkey:", initialState.fullkey);
    console.log("Initial state depth:", initialState.depth);
    console.log("Initial state stack:", initialState.stack);
    console.log("Initial state data:", initialState.data);
    
    console.log("\n=== AFTER FOCUS ===");
    machine.focus();
    const activeState = machine.getState();
    console.log("Active state key:", activeState.key);
    console.log("Active state fullkey:", activeState.fullkey);
    console.log("Active state depth:", activeState.depth);
    console.log("Active state stack:", activeState.stack);
    console.log("Active state data keys:", Object.keys(activeState.data || {}));
    
    if (activeState.data?.machine) {
      console.log("\n=== NESTED MACHINE ===");
      const nestedMachine = activeState.data.machine;
      const nestedState = nestedMachine.getState();
      console.log("Nested state key:", nestedState.key);
      console.log("Nested state fullkey:", nestedState.fullkey);
      console.log("Nested state depth:", nestedState.depth);
      console.log("Nested state stack:", nestedState.stack);
      console.log("Nested state data:", nestedState.data);
      
      console.log("\n=== GOING TO QUERY STATE ===");
      machine.activeMachine.typed("test");
      machine.activeMachine.submit();
      
      const queryState = nestedMachine.getState();
      console.log("Query state key:", queryState.key);
      console.log("Query state fullkey:", queryState.fullkey);
      console.log("Query state depth:", queryState.depth);
      console.log("Query state stack:", queryState.stack);
      console.log("Query state data keys:", Object.keys(queryState.data || {}));
      
      if (queryState.data?.machine) {
        console.log("\n=== PROMISE MACHINE ===");
        const promiseMachine = queryState.data.machine;
        const promiseState = promiseMachine.getState();
        console.log("Promise state key:", promiseState.key);
        console.log("Promise state fullkey:", promiseState.fullkey);
        console.log("Promise state depth:", promiseState.depth);
        console.log("Promise state stack:", promiseState.stack);
        console.log("Promise state data:", promiseState.data);
      }
    }
  });
});