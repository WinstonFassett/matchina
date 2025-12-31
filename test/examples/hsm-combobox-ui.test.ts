import { describe, it, expect } from "vitest";
import { createFlatComboboxMachine } from "../../docs/src/code/examples/hsm-combobox/machine-flat";

describe("Flat Combobox UI Integration", () => {
  it("should handle real-world usage patterns", async () => {
    const machine = createFlatComboboxMachine();

    // Initial state should be Inactive
    expect(machine.getState().key).toBe("Inactive");

    // Focus to activate
    machine.send("focus");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(machine.getState().key).toBe("Active.Empty");

    // Type something that matches suggestions (should auto-transition to Suggesting)
    machine.send("typed", "typ");
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const state = machine.getState();
    const storeState = machine.store.getState();
    
    // Should have auto-transitioned to Suggesting
    expect(state.key).toBe("Active.Suggesting");
    expect(storeState.input).toBe("typ");
    expect(storeState.suggestions).toContain("typescript");

    // Add a tag from suggestions
    machine.send("selectHighlighted");
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const finalState = machine.getState();
    const finalStoreState = machine.store.getState();
    
    // Should be back to Empty with tag added
    expect(finalState.key).toBe("Active.Empty");
    expect(finalStoreState.selectedTags).toContain("typescript");
    expect(finalStoreState.input).toBe("");
  });

  it("should handle typing without suggestions", async () => {
    const machine = createFlatComboboxMachine();

    machine.send("focus");
    await new Promise(resolve => setTimeout(resolve, 0));

    // Type something that won't match suggestions
    machine.send("typed", "zzz");
    await new Promise(resolve => setTimeout(resolve, 10));

    const state = machine.getState();
    const storeState = machine.store.getState();
    
    // Should have auto-transitioned to TextEntry
    expect(state.key).toBe("Active.TextEntry");
    expect(storeState.input).toBe("zzz");
    expect(storeState.suggestions).toEqual([]);
  });
});
