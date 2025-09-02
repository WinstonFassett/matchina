import { describe, test, expect } from 'vitest';
import { createSearchBarMachine } from '../docs/src/code/examples/hsm-searchbar/machine';

describe('Context Propagation Bug', () => {
  test("nested machine should inherit parent context in fullKey", () => {
    const machine = createSearchBarMachine();
    machine.focus();
    
    const activeState = machine.getState();
    expect(activeState.key).toBe("Active");
    expect(activeState.fullKey).toBe("Active");
    
    const nestedMachine = activeState.data.machine;
    expect(nestedMachine).toBeDefined();
    
    const nestedState = nestedMachine.getState();
    expect(nestedState.key).toBe("Empty");
    expect(nestedState.fullKey).toBe("Active.Empty");
    expect(nestedState.depth).toBe(1);
  });
});