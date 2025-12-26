/**
 * Pure unit test to reproduce the context propagation bug
 * WITHOUT React - just the core propagateSubmachines logic
 */

import { describe, test, expect } from "vitest";
import { getFullKey, getDepth, getStack } from "../src/nesting/inspect";
import { createSearchBarMachine } from "../docs/src/code/examples/hsm-searchbar/machine";

describe("Context Propagation Bug", () => {
  test("nested machine should inherit parent context in fullKey", () => {
    const machine = createSearchBarMachine();

    // Focus to get to Active state with nested machine
    machine.focus();

    const activeState = machine.getState();
    expect(activeState.key).toBe("Active");
    expect(getFullKey(machine)).toBe("Active.Empty"); // Root level includes child state

    // The nested machine should have context that includes parent
    const nestedMachine = activeState.data.machine;
    const nestedState = nestedMachine.getState();

    // Now using inspect utilities instead of stamped properties
    expect(getFullKey(nestedMachine)).toBe("Empty");
    expect(getDepth(machine, nestedState)).toBe(1);
    expect(getStack(machine)).toHaveLength(2); // [Active, Empty]
  });
});
