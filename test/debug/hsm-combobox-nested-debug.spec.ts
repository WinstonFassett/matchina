import { describe, it, expect } from "vitest";
import { createFlatComboboxMachine } from "../../docs/src/code/examples/hsm-combobox/flattened/machine";
import { createComboboxMachine } from "../../docs/src/code/examples/hsm-combobox/nested/machine";

describe("DEBUG: HSM Combobox Nested vs Flat Shape Comparison", () => {
  it("should create identical machine shapes", () => {
    const flatMachine = createFlatComboboxMachine();
    const nestedMachine = createComboboxMachine();

    console.log("=== FLAT MACHINE STATE ===");
    console.log("Initial state:", flatMachine.getState().key);
    console.log("Initial state value:", flatMachine.getState());
    
    console.log("\n=== NESTED MACHINE STATE ===");
    console.log("Initial state:", nestedMachine.getState().key);
    console.log("Initial state value:", nestedMachine.getState());
    
    // Check child state
    const nestedState = nestedMachine.getState();
    if (nestedState.key === "Active" && nestedState.data?.machine) {
      console.log("Child machine state:", nestedState.data.machine.getState().key);
      console.log("Full hierarchical state should be:", `Active.${nestedState.data.machine.getState().key}`);
    }

    // Both should start in Inactive
    expect(flatMachine.getState().key).toBe("Inactive");
    expect(nestedMachine.getState().key).toBe("Inactive");
  });

  it("should have identical API methods", () => {
    const flatMachine = createFlatComboboxMachine();
    const nestedMachine = createComboboxMachine();

    console.log("\n=== FLAT MACHINE API ===");
    console.log("Flat machine methods:", Object.getOwnPropertyNames(flatMachine));
    console.log("Flat machine model:", !!flatMachine.model);
    
    console.log("\n=== NESTED MACHINE API ===");
    console.log("Nested machine methods:", Object.getOwnPropertyNames(nestedMachine));
    console.log("Nested machine model:", !!nestedMachine.model);

    // Both should have the same core methods
    const flatMethods = Object.getOwnPropertyNames(flatMachine);
    const nestedMethods = Object.getOwnPropertyNames(nestedMachine);
    
    console.log("Methods only in flat:", flatMethods.filter(m => !nestedMethods.includes(m)));
    console.log("Methods only in nested:", nestedMethods.filter(m => !flatMethods.includes(m)));

    // Both should have a model
    expect(flatMachine.model).toBeDefined();
    expect(nestedMachine.model).toBeDefined();
  });

  it("should handle focus identically", () => {
    const flatMachine = createFlatComboboxMachine();
    const nestedMachine = createComboboxMachine();

    // Focus both machines
    flatMachine.send("focus");
    nestedMachine.send("focus");

    console.log("\n=== AFTER FOCUS ===");
    console.log("Flat state:", flatMachine.getState().key);
    console.log("Nested state:", nestedMachine.getState().key);

    // Both should be in Active state (nested shows parent, flat shows hierarchical)
    expect(flatMachine.getState().key).toBe("Active.Empty");
    expect(nestedMachine.getState().key).toBe("Active");
  });

  it("should handle typing identically", () => {
    const flatMachine = createFlatComboboxMachine();
    const nestedMachine = createComboboxMachine();

    // Focus and type
    flatMachine.send("focus");
    nestedMachine.send("focus");

    flatMachine.setInput("typ");
    flatMachine.send("type");

    nestedMachine.setInput("typ");

    console.log("\n=== AFTER TYPING 'typ' ===");
    console.log("Flat state:", flatMachine.getState().key);
    console.log("Flat suggestions:", flatMachine.model.getState().suggestions);
    console.log("Nested state:", nestedMachine.getState().key);
    console.log("Nested suggestions:", nestedMachine.model.getState().suggestions);
    
    // Debug child state - nested machine uses "Active" key, child state is in data.machine
    const nestedState = nestedMachine.getState();
    if (nestedState.key === "Active" && nestedState.data?.machine) {
      const childStateKey = nestedState.data.machine.getState().key;
      console.log("Child machine state:", childStateKey);
      console.log("Full hierarchical state should be:", `Active.${childStateKey}`);
    }

    // Both should have same suggestions
    expect(flatMachine.model.getState().suggestions).toEqual(nestedMachine.model.getState().suggestions);
    expect(flatMachine.model.getState().suggestions).toContain("typescript");
  });

  it("should handle selection identically", () => {
    const flatMachine = createFlatComboboxMachine();
    const nestedMachine = createComboboxMachine();

    // Focus, type, and select
    flatMachine.send("focus");
    nestedMachine.send("focus");

    flatMachine.setInput("typ");
    flatMachine.send("type", "typ");

    nestedMachine.setInput("typ");

    // Select first suggestion
    flatMachine.setHighlighted(0);
    flatMachine.send("select");

    nestedMachine.setHighlighted(0);
    // For nested machine, trigger child event and call store method directly
    const childData = nestedMachine.getState().data;
    if (childData?.machine) {
      childData.machine.send("select");
    }
    nestedMachine.selectHighlighted();

    console.log("\n=== AFTER SELECTION ===");
    console.log("Flat state:", flatMachine.getState().key);
    console.log("Flat tags:", flatMachine.model.getState().selectedTags);
    console.log("Nested state:", nestedMachine.getState().key);
    console.log("Nested tags:", nestedMachine.model.getState().selectedTags);

    // Both should have the same tag added
    expect(flatMachine.model.getState().selectedTags).toEqual(nestedMachine.model.getState().selectedTags);
    expect(flatMachine.model.getState().selectedTags).toContain("typescript");
  });

  it("should handle adding custom tags identically", () => {
    const flatMachine = createFlatComboboxMachine();
    const nestedMachine = createComboboxMachine();

    // Focus and add custom tag
    flatMachine.send("focus");
    nestedMachine.send("focus");

    flatMachine.send("addTag");
    nestedMachine.send("addTag");

    console.log("\n=== AFTER ADD TAG ===");
    console.log("Flat state:", flatMachine.getState().key);
    console.log("Nested state:", nestedMachine.getState().key);

    // Both should handle addTag the same way
    expect(flatMachine.getState().key).toBe("Active.Empty");
    expect(nestedMachine.getState().key).toBe("Active");
  });
});
