import { describe, it, expect } from "vitest";
import {
  getActiveStatePath,
  buildVisualizerTree,
} from "../docs/src/code/examples/lib/matchina-machine-to-xstate-definition";
import { createCheckoutMachine } from "../docs/src/code/examples/hsm-checkout/machine";
import { createFlatCheckoutMachine } from "../docs/src/code/examples/hsm-checkout/machine-flat";
import { createComboboxMachine } from "../docs/src/code/examples/hsm-combobox/machine";
import { createFlatComboboxMachine } from "../docs/src/code/examples/hsm-combobox/machine-flat";

describe("Unified HSM Visualization", () => {
  describe("getActiveStatePath", () => {
    it("should return dot-joined path for hierarchical checkout machine", () => {
      const machine = createCheckoutMachine();

      // Initial state should be 'Cart'
      const path = getActiveStatePath(machine);
      expect(path).toBe("Cart");

      // Navigate to Payment
      (machine as any).send("proceed"); // Cart -> Shipping
      (machine as any).send("proceed"); // Shipping -> Payment

      const paymentPath = getActiveStatePath(machine);
      expect(paymentPath).toBe("Payment.MethodEntry"); // Should include nested state
    });

    it("should return dot-joined path for flattened checkout machine", () => {
      const machine = createFlatCheckoutMachine();

      // Initial state should be 'Cart'
      const path = getActiveStatePath(machine);
      expect(path).toBe("Cart");

      // Navigate to Payment
      (machine as any).send("proceed"); // Cart -> Shipping
      (machine as any).send("proceed"); // Shipping -> Payment

      const paymentPath = getActiveStatePath(machine);
      expect(paymentPath).toBe("Payment.MethodEntry"); // Should be flattened key
    });

    // TODO: This test needs to be updated for new combobox API
    // it.skip('should return dot-joined path for hierarchical combobox machine', () => {
    //   const machine = createComboboxMachine();
    //
    //   // Initial state should be 'Inactive'
    //   const path = getActiveStatePath(machine);
    //   expect(path).toBe('Inactive');
    //
    //   // Activate and type
    //   machine.send('focus'); // Inactive -> Active
    //   // For hierarchical combobox, typing happens in child machine
    //   const activeMachine = (machine.getState().data as any)?.machine;
    //   if (activeMachine) {
    //     activeMachine.send('typed'); // Trigger typing in child
    //   }
    //
    //   const activePath = getActiveStatePath(machine);
    //   expect(activePath).toBe('Active.Suggesting'); // Should include nested state
    // });

    // Skipped: combobox now returns component wrapper, not raw machine
    // Visualization is tested with checkout machine above
    it.skip("should return dot-joined path for flattened combobox machine", () => {
      const machine = createFlatComboboxMachine();
      // ...
    });
  });

  describe("buildVisualizerTree consistency", () => {
    it("should return consistent structure for hierarchical checkout machine", () => {
      const machine = createCheckoutMachine();
      const definition = buildVisualizerTree(machine);

      // Should have hierarchical structure
      expect(definition.states).toBeDefined();
      expect(definition.states.Payment).toBeDefined();
      expect(definition.states.Payment.states).toBeDefined();
      expect(definition.states.Payment.states.MethodEntry).toBeDefined();

      // All states should have fullKey with dots
      expect(definition.states.Payment.fullKey).toBe("Payment");
      expect(definition.states.Payment.states.MethodEntry.fullKey).toBe(
        "Payment.MethodEntry"
      );
    });

    it("should return consistent structure for flattened checkout machine", () => {
      const machine = createFlatCheckoutMachine();
      const definition = buildVisualizerTree(machine);

      // Should have hierarchical structure (built from original definition)
      expect(definition.states).toBeDefined();
      expect(definition.states.Payment).toBeDefined();
      expect(definition.states.Payment.states).toBeDefined();
      expect(definition.states.Payment.states.MethodEntry).toBeDefined();

      // All states should have fullKey with dots (not underscores)
      expect(definition.states.Payment.fullKey).toBe("Payment");
      expect(definition.states.Payment.states.MethodEntry.fullKey).toBe(
        "Payment.MethodEntry"
      );
    });

    it("should return consistent structure for hierarchical combobox machine", () => {
      const machine = createComboboxMachine();
      const definition = buildVisualizerTree(machine);

      // Should have hierarchical structure
      expect(definition.states).toBeDefined();
      expect(definition.states.Active).toBeDefined();
      expect(definition.states.Active.states).toBeDefined();
      expect(definition.states.Active.states.Empty).toBeDefined();

      // All states should have fullKey with dots
      expect(definition.states.Active.fullKey).toBe("Active");
      expect(definition.states.Active.states.Empty.fullKey).toBe(
        "Active.Empty"
      );
    });

    // Skipped: combobox now returns component wrapper, not raw machine
    // Visualization is tested with checkout machine above
    it.skip("should return consistent structure for flattened combobox machine", () => {
      const machine = createFlatComboboxMachine();
      // ...
    });
  });

  describe("State matching consistency", () => {
    it("should match active states correctly for hierarchical machines", () => {
      const machine = createCheckoutMachine();
      const definition = buildVisualizerTree(machine);

      // Navigate to Payment
      (machine as any).send("proceed"); // Cart -> Shipping
      (machine as any).send("proceed"); // Shipping -> Payment

      const activePath = getActiveStatePath(machine);

      // Should match the fullKey in the definition
      const paymentState = definition.states.Payment.states.MethodEntry;
      expect(paymentState.fullKey).toBe(activePath);
    });

    it("should match active states correctly for flattened machines", () => {
      const machine = createFlatCheckoutMachine();
      const definition = buildVisualizerTree(machine);

      // Navigate to Payment
      (machine as any).send("proceed"); // Cart -> Shipping
      (machine as any).send("proceed"); // Shipping -> Payment

      const activePath = getActiveStatePath(machine);

      // Should match the fullKey in the definition
      const paymentState = definition.states.Payment.states.MethodEntry;
      expect(paymentState.fullKey).toBe(activePath);
    });
  });
});
