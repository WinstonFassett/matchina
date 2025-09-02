/**
 * Pure unit test to reproduce the context propagation bug
 * WITHOUT React - just the core propagateSubmachines logic
 */

import { describe, test, expect } from "vitest";
import { createSearchBarMachine } from "../docs/src/code/examples/hsm-searchbar/machine";

describe("Context Propagation Bug", () => {
  test("nested machine should inherit parent context in fullKey", () => {
    const machine = createSearchBarMachine();
    
    // Focus to get to Active state with nested machine
    machine.focus();
    
    const activeState = machine.getState();
    expect(activeState.key).toBe("Active");
    expect(activeState.fullKey).toBe("Active"); // Root level should be just "Active"
    
    // The nested machine should have context that includes parent
    const nestedMachine = activeState.data.machine;
    const nestedState = nestedMachine.getState();
    
    console.log("DEBUG: nested state fullKey:", nestedState.fullKey);
    console.log("DEBUG: nested state depth:", nestedState.depth);
    console.log("DEBUG: nested state stack:", nestedState.stack?.map((s: any) => s.key));
    
    // BUG: This fails - we get "Empty" instead of "Active.Empty"
    expect(nestedState.fullKey).toBe("Active.Empty");
    expect(nestedState.depth).toBe(1);
    expect(nestedState.stack).toHaveLength(2); // [Active, Empty]
  });
});