import { describe, it, expect } from "vitest";
import { createFlatComboboxMachine } from "../../docs/src/code/examples/hsm-combobox/flattened/machine";

describe("HSM Combobox (Flat)", () => {
  it("should initialize to Inactive", () => {
    const combobox = createFlatComboboxMachine();
    const { input, selectedTags, suggestions } = combobox.model.getState();

    expect(combobox.getState().is("Inactive")).toBe(true);
    expect(input).toBe("");
    expect(selectedTags).toEqual([]);
    expect(suggestions).toEqual([]);
  });

  it("should transition to Active/Empty on focus", () => {
    const combobox = createFlatComboboxMachine();
    combobox.focus();

    expect(combobox.getState().is("Active.Empty")).toBe(true);
  });

  it("should stay at Empty when typing with no suggestions", () => {
    const combobox = createFlatComboboxMachine();
    combobox.focus();
    combobox.type("zzz");

    // No guard - still transitions to Suggesting, but UI hides empty dropdown
    expect(combobox.getState().is("Active.Suggesting")).toBe(true);
    expect(combobox.model.getState().input).toBe("zzz");
    expect(combobox.model.getState().suggestions).toEqual([]);
  });

  it("should transition to Suggesting when there are suggestions", () => {
    const combobox = createFlatComboboxMachine();
    combobox.focus();
    combobox.type("typ");

    expect(combobox.getState().is("Active.Suggesting")).toBe(true);
    expect(combobox.model.getState().input).toBe("typ");
    expect(combobox.model.getState().suggestions).toContain("typescript");
  });

  it("should select suggestion and return to Empty", () => {
    const combobox = createFlatComboboxMachine();
    combobox.focus();
    combobox.type("typ");
    combobox.selectSuggestion();

    expect(combobox.getState().is("Active.Empty")).toBe(true);
    expect(combobox.model.getState().selectedTags).toContain("typescript");
    expect(combobox.model.getState().input).toBe("");
  });

  it("should dismiss suggestions and clear input", () => {
    const combobox = createFlatComboboxMachine();
    combobox.focus();
    combobox.type("typ");
    expect(combobox.getState().is("Active.Suggesting")).toBe(true);

    combobox.dismiss();

    expect(combobox.model.getState().input).toBe("");
    // Should still be in Suggesting since dismiss just clears input
  });

  it("should blur and return to Inactive", () => {
    const combobox = createFlatComboboxMachine();
    combobox.focus();
    combobox.type("typ");
    combobox.blur();

    expect(combobox.getState().is("Inactive")).toBe(true);
  });

  it("should add and remove tags", () => {
    const combobox = createFlatComboboxMachine();
    combobox.addTag("custom");
    expect(combobox.model.getState().selectedTags).toContain("custom");

    combobox.removeTag("custom");
    expect(combobox.model.getState().selectedTags).not.toContain("custom");
  });

  it("should highlight next and prev", () => {
    const combobox = createFlatComboboxMachine();
    combobox.focus();
    combobox.type("a"); // matches angular

    expect(combobox.model.getState().highlightedIndex).toBe(0);
    combobox.highlight("next");
    expect(combobox.model.getState().highlightedIndex).toBe(1);
    combobox.highlight("prev");
    expect(combobox.model.getState().highlightedIndex).toBe(0);
  });
});
