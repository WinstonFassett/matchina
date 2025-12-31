import { describe, it, expect } from "vitest";
import { createFlatComboboxMachine } from "../../docs/src/code/examples/hsm-combobox/machine-flat";

describe("HSM Combobox (Flat)", () => {
  it("should initialize to Inactive with empty selectedTags array", () => {
    const machine = createFlatComboboxMachine();
    const state = machine.getState();
    const storeState = machine.store.getState();

    expect(state.key).toBe("Inactive");
    expect(storeState.selectedTags).toEqual([]);
    expect(Array.isArray(storeState.selectedTags)).toBe(true);
  });

  it("should transition to Active.Empty on focus", async () => {
    const machine = createFlatComboboxMachine();

    machine.send("focus");

    // Wait for any async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    const state = machine.getState();
    const storeState = machine.store.getState();
    expect(state.key).toBe("Active.Empty");
    expect(storeState.selectedTags).toEqual([]);
    expect(Array.isArray(storeState.selectedTags)).toBe(true);
  });

  it("should auto-transition from Typing to TextEntry when no suggestions", async () => {
    const machine = createFlatComboboxMachine();

    machine.send("focus");
    await new Promise(resolve => setTimeout(resolve, 0));

    // Type something that won't match suggestions
    machine.send("typed", "zzz");

    // Wait for auto-transition
    await new Promise(resolve => setTimeout(resolve, 10));

    const state = machine.getState();
    const storeState = machine.store.getState();
    expect(state.key).toBe("Active.TextEntry");
    expect(storeState.input).toBe("zzz");
  });

  it("should auto-transition from Typing to Suggesting when there are suggestions", async () => {
    const machine = createFlatComboboxMachine();

    machine.send("focus");
    await new Promise(resolve => setTimeout(resolve, 0));

    // Type something that matches suggestions (e.g., "typ" matches "typescript")
    machine.send("typed", "typ");

    // Wait for auto-transition
    await new Promise(resolve => setTimeout(resolve, 10));

    const state = machine.getState();
    const storeState = machine.store.getState();
    expect(state.key).toBe("Active.Suggesting");
    expect(storeState.input).toBe("typ");
    expect(storeState.suggestions).toContain("typescript");
  });

  it("should have hierarchical shape metadata", () => {
    const machine = createFlatComboboxMachine();

    // Verify shape exists for visualization
    expect((machine as any).shape).toBeDefined();
  });
});
