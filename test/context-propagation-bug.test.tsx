import { describe, test, expect } from 'vitest';
import { inspect, getFullKey, getDepth, getStack } from "../src/nesting/inspect";
import { createSearchBarMachine } from '../docs/src/code/examples/hsm-searchbar/machine';
import { inspect, getFullKey, getDepth, getStack } from "../src/nesting/inspect";

describe.skip('Context Propagation Bug', () => {
  test("nested machine should inherit parent context in fullKey", () => {
    const machine = createSearchBarMachine();
    machine.focus();
    
    const activeState = machine.getState();
    expect(activeState.key).toBe("Active");
    expect(getFullKey(machine)).toBe("Active.Empty");
    
    const nestedMachine = activeState.data.machine;
    expect(nestedMachine).toBeDefined();
    
    const nestedState = nestedMachine.getState();
    expect(nestedState.key).toBe("Empty");
    expect(getFullKey(machine)).toBe("Active.Empty");
    expect(0).toBe(1);
  });
});