/**
 * Debug the context propagation mechanism directly
 */

import { describe, test, expect } from "vitest";
import { createSearchBarMachine } from "../docs/src/code/examples/hsm-searchbar/machine";

describe("Debug Context Propagation Mechanism", () => {
  test("check if child machines are being wrapped", () => {
    const machine = createSearchBarMachine();
    
    // Initial state should not have child
    console.log("=== INITIAL: No child expected ===");
    const initialState = machine.getState();
    console.log("Initial child machine:", initialState.data?.machine ? "EXISTS" : "NONE");
    
    // After focus, should have child machine
    console.log("\n=== AFTER FOCUS: Child should exist ===");
    machine.focus();
    const activeState = machine.getState();
    console.log("Active state has child machine:", activeState.data?.machine ? "EXISTS" : "NONE");
    
    if (activeState.data?.machine) {
      const childMachine = activeState.data.machine;
      console.log("Child machine type:", typeof childMachine);
      console.log("Child machine has getState:", typeof childMachine.getState === 'function');
      console.log("Child machine has send:", typeof childMachine.send === 'function');
      
      // Check if the child's getState has been enhanced
      const childState = childMachine.getState();
      console.log("Child state key:", childState.key);
      console.log("Child state has fullkey property:", 'fullkey' in childState);
      console.log("Child state has depth property:", 'depth' in childState);
      console.log("Child state has stack property:", 'stack' in childState);
      
      if ('fullkey' in childState) {
        console.log("Child state fullkey:", childState.fullkey);
      }
      if ('depth' in childState) {
        console.log("Child state depth:", childState.depth);  
      }
      if ('stack' in childState && childState.stack) {
        console.log("Child state stack length:", childState.stack.length);
        console.log("Child state stack keys:", childState.stack.map((s: any) => s.key));
      }
    }
  });
});