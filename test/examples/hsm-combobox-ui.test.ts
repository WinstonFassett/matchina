import { describe, it, expect } from "vitest";
import { createFlatComboboxMachine } from "../../docs/src/code/examples/hsm-combobox/machine-flat";

describe("Flat Combobox UI Integration", () => {
  it("should handle real-world usage patterns", () => {
    const combobox = createFlatComboboxMachine();

    // Initial state should be Inactive
    expect(combobox.getState().is('Inactive')).toBe(true);

    // Focus to activate
    combobox.focus();
    expect(combobox.getState().is('Active.Empty')).toBe(true);

    // Type something that matches suggestions
    combobox.setInput("typ");

    // Should have transitioned to Suggesting
    expect(combobox.getState().is('Active.Suggesting')).toBe(true);
    expect(combobox.model.getState().input).toBe("typ");
    expect(combobox.model.getState().suggestions).toContain("typescript");

    // Select the suggestion
    combobox.selectSuggestion();

    // Should be back to Empty with tag added
    expect(combobox.getState().is('Active.Empty')).toBe(true);
    expect(combobox.model.getState().selectedTags).toContain("typescript");
    expect(combobox.model.getState().input).toBe("");
  });

  it("should handle typing without suggestions", () => {
    const combobox = createFlatComboboxMachine();

    combobox.focus();
    expect(combobox.getState().is('Active.Empty')).toBe(true);

    // Type something that won't match suggestions
    combobox.setInput("zzz");

    // No guard - transitions to Suggesting, UI hides empty dropdown
    expect(combobox.getState().is('Active.Suggesting')).toBe(true);
    expect(combobox.model.getState().input).toBe("zzz");
    expect(combobox.model.getState().suggestions).toEqual([]);
  });
});
