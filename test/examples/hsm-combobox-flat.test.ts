import { describe, it, expect } from "vitest";
import { createFlatComboboxMachine } from "../../docs/src/code/examples/hsm-combobox/machine-flat";

describe("HSM Combobox (Flat)", () => {
  it("should initialize to Inactive with empty selectedTags array", () => {
    const machine = createFlatComboboxMachine();
    const state = machine.getState();

    expect(state.key).toBe("Inactive");
    expect(state.data.selectedTags).toEqual([]);
    expect(Array.isArray(state.data.selectedTags)).toBe(true);
  });

  it("should transition to Active.Empty on activate", async () => {
    const machine = createFlatComboboxMachine();

    machine.send("activate");

    // Wait for any async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    const state = machine.getState();
    expect(state.key).toBe("Active.Empty");
    expect(state.data.selectedTags).toEqual([]);
    expect(Array.isArray(state.data.selectedTags)).toBe(true);
  });

  it("should preserve selectedTags through activate/deactivate cycle", async () => {
    const machine = createFlatComboboxMachine();

    // Activate
    machine.send("activate");
    await new Promise(resolve => setTimeout(resolve, 0));

    // Add a tag
    machine.send("addTag", "typescript", []);
    await new Promise(resolve => setTimeout(resolve, 0));

    const activeState = machine.getState();
    expect(activeState.data.selectedTags).toEqual(["typescript"]);

    // Deactivate
    machine.send("deactivate", ["typescript"]);
    await new Promise(resolve => setTimeout(resolve, 0));

    const inactiveState = machine.getState();
    expect(inactiveState.key).toBe("Inactive");
    expect(inactiveState.data.selectedTags).toEqual(["typescript"]);

    // Reactivate and verify tags persist
    machine.send("activate");
    await new Promise(resolve => setTimeout(resolve, 0));

    const reactivatedState = machine.getState();
    expect(reactivatedState.data.selectedTags).toEqual(["typescript"]);
  });

  it("should auto-transition from Typing to TextEntry when no suggestions", async () => {
    const machine = createFlatComboboxMachine();

    machine.send("activate");
    await new Promise(resolve => setTimeout(resolve, 0));

    // Type something that won't match suggestions
    machine.send("typed", "zzz", []);

    // Wait for auto-transition
    await new Promise(resolve => setTimeout(resolve, 10));

    const state = machine.getState();
    expect(state.key).toBe("Active.TextEntry");
    expect(state.data.input).toBe("zzz");
  });

  it("should auto-transition from Typing to Suggesting when there are suggestions", async () => {
    const machine = createFlatComboboxMachine();

    machine.send("activate");
    await new Promise(resolve => setTimeout(resolve, 0));

    // Type something that matches suggestions (e.g., "typ" matches "typescript")
    machine.send("typed", "typ", []);

    // Wait for auto-transition
    await new Promise(resolve => setTimeout(resolve, 10));

    const state = machine.getState();
    expect(state.key).toBe("Active.Suggesting");
    expect(state.data.input).toBe("typ");
    expect(state.data.suggestions).toContain("typescript");
  });

  it("should remove tags correctly", async () => {
    const machine = createFlatComboboxMachine();

    machine.send("activate");
    await new Promise(resolve => setTimeout(resolve, 0));

    // Add two tags
    machine.send("addTag", "typescript", []);
    await new Promise(resolve => setTimeout(resolve, 0));

    machine.send("addTag", "react", ["typescript"]);
    await new Promise(resolve => setTimeout(resolve, 0));

    let state = machine.getState();
    expect(state.data.selectedTags).toEqual(["typescript", "react"]);

    // Remove one tag
    machine.send("removeTag", "typescript", ["typescript", "react"]);
    await new Promise(resolve => setTimeout(resolve, 0));

    state = machine.getState();
    expect(state.data.selectedTags).toEqual(["react"]);
  });

  it("should have hierarchical shape metadata", () => {
    const machine = createFlatComboboxMachine();

    // Verify shape exists for visualization
    expect((machine as any).shape).toBeDefined();
  });
});
