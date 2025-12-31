import { describe, it, expect } from "vitest";
import { createFlatComboboxMachine } from "../../docs/src/code/examples/hsm-combobox/machine-flat";

describe("HSM Combobox (Flat)", () => {
  it("should initialize to Inactive with empty selectedTags array", () => {
    const machine = createFlatComboboxMachine();
    const state = machine.getState();
    const storeState = machine.store.getState();

    expect(state.key).toBe("Inactive");
    expect(storeState.selectedTags).toEqual([]);
    expect(storeState.input).toBe("");
    expect(storeState.suggestions).toEqual([]);
  });

  it("should transition to Active.Empty on focus", () => {
    const machine = createFlatComboboxMachine();
    machine.send("focus");
    
    const state = machine.getState();
    const storeState = machine.store.getState();
    expect(state.key).toBe("Active.Empty");
    expect(storeState.selectedTags).toEqual([]);
    expect(storeState.input).toBe("");
  });

  it("should auto-transition from Typing to TextEntry when no suggestions", async () => {
    const machine = createFlatComboboxMachine();
    machine.send("focus");
    
    // Type something that won't match suggestions - this should transition to Typing then auto-transition to TextEntry
    machine.send("typed", "zzz");
    
    // Wait a bit for auto-transition
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const state = machine.getState();
    const storeState = machine.store.getState();
    expect(state.key).toBe("Active.TextEntry");
    expect(storeState.input).toBe("zzz");
    expect(storeState.suggestions).toEqual([]);
  });

  it("should auto-transition from Typing to Suggesting when there are suggestions", async () => {
    const machine = createFlatComboboxMachine();
    machine.send("focus");
    
    // Type something that matches suggestions (e.g., "typ" matches "typescript")
    machine.send("typed", "typ");
    
    // Wait a bit for auto-transition
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const state = machine.getState();
    const storeState = machine.store.getState();
    expect(state.key).toBe("Active.Suggesting");
    expect(storeState.input).toBe("typ");
    expect(storeState.suggestions).toContain("typescript");
  });
});
