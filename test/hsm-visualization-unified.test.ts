import { describe, it, expect } from 'vitest';
import { getActiveStatePath, buildVisualizerTree } from '../docs/src/code/examples/lib/matchina-machine-to-xstate-definition';
import { createCheckoutMachine } from '../docs/src/code/examples/hsm-checkout/machine';
import { createFlatCheckoutMachine } from '../docs/src/code/examples/hsm-checkout/machine-flat';
import { createComboboxMachine } from '../docs/src/code/examples/hsm-combobox/machine';
import { createFlatComboboxMachine } from '../docs/src/code/examples/hsm-combobox/machine-flat';

describe('Unified HSM Visualization', () => {
  describe('getActiveStatePath', () => {
    it('should return dot-joined path for hierarchical checkout machine', () => {
      const machine = createCheckoutMachine();
      
      // Initial state should be 'Cart'
      const path = getActiveStatePath(machine);
      expect(path).toBe('Cart');
      
      // Navigate to Payment
      (machine as any).send('proceed'); // Cart -> Shipping
      (machine as any).send('proceed'); // Shipping -> Payment
      
      const paymentPath = getActiveStatePath(machine);
      expect(paymentPath).toBe('Payment.MethodEntry'); // Should include nested state
    });

    it('should return dot-joined path for flattened checkout machine', () => {
      const machine = createFlatCheckoutMachine();
      
      // Initial state should be 'Cart'
      const path = getActiveStatePath(machine);
      expect(path).toBe('Cart');
      
      // Navigate to Payment
      (machine as any).send('proceed'); // Cart -> Shipping
      (machine as any).send('proceed'); // Shipping -> Payment
      
      const paymentPath = getActiveStatePath(machine);
      expect(paymentPath).toBe('Payment.MethodEntry'); // Should be flattened key
    });

    it('should return dot-joined path for hierarchical combobox machine', () => {
      const machine = createComboboxMachine();
      
      // Initial state should be 'Inactive'
      const path = getActiveStatePath(machine);
      expect(path).toBe('Inactive');
      
      // Activate and type
      machine.send('focus'); // Inactive -> Active
      machine.send('typed', 'react'); // Active -> Active.Suggesting
      
      const activePath = getActiveStatePath(machine);
      expect(activePath).toBe('Active.Suggesting'); // Should include nested state
    });

    it('should return dot-joined path for flattened combobox machine', () => {
      const machine = createFlatComboboxMachine();

      // Initial state should be 'Inactive'
      const path = getActiveStatePath(machine);
      expect(path).toBe('Inactive');

      // Activate with empty selected tags
      machine.send('focus'); // Inactive -> Active.Empty
      
      // Type with proper parameters
      machine.send('typed', 'react', []); // Active.Empty -> Active.Typing
      
      const activePath = getActiveStatePath(machine);
      expect(activePath).toBe('Active.Typing'); // Should be flattened key
    });
  });

  describe('buildVisualizerTree consistency', () => {
    it('should return consistent structure for hierarchical checkout machine', () => {
      const machine = createCheckoutMachine();
      const definition = buildVisualizerTree(machine);
      
      // Should have hierarchical structure
      expect(definition.states).toBeDefined();
      expect(definition.states.Payment).toBeDefined();
      expect(definition.states.Payment.states).toBeDefined();
      expect(definition.states.Payment.states.MethodEntry).toBeDefined();
      
      // All states should have fullKey with dots
      expect(definition.states.Payment.fullKey).toBe('Payment');
      expect(definition.states.Payment.states.MethodEntry.fullKey).toBe('Payment.MethodEntry');
    });

    it('should return consistent structure for flattened checkout machine', () => {
      const machine = createFlatCheckoutMachine();
      const definition = buildVisualizerTree(machine);
      
      // Should have hierarchical structure (built from original definition)
      expect(definition.states).toBeDefined();
      expect(definition.states.Payment).toBeDefined();
      expect(definition.states.Payment.states).toBeDefined();
      expect(definition.states.Payment.states.MethodEntry).toBeDefined();
      
      // All states should have fullKey with dots (not underscores)
      expect(definition.states.Payment.fullKey).toBe('Payment');
      expect(definition.states.Payment.states.MethodEntry.fullKey).toBe('Payment.MethodEntry');
    });

    it('should return consistent structure for hierarchical combobox machine', () => {
      const machine = createComboboxMachine();
      const definition = buildVisualizerTree(machine);
      
      // Should have hierarchical structure
      expect(definition.states).toBeDefined();
      expect(definition.states.Active).toBeDefined();
      expect(definition.states.Active.states).toBeDefined();
      expect(definition.states.Active.states.Empty).toBeDefined();
      
      // All states should have fullKey with dots
      expect(definition.states.Active.fullKey).toBe('Active');
      expect(definition.states.Active.states.Empty.fullKey).toBe('Active.Empty');
    });

    it('should return consistent structure for flattened combobox machine', () => {
      const machine = createFlatComboboxMachine();
      const definition = buildVisualizerTree(machine);
      
      // Flattened machines have direct dot-notation states, no synthetic parents
      expect(definition.states).toBeDefined();
      expect(definition.states['Active.Empty']).toBeDefined();
      expect(definition.states['Active.Typing']).toBeDefined();
      expect(definition.states['Active.TextEntry']).toBeDefined();
      expect(definition.states['Active.Suggesting']).toBeDefined();
      expect(definition.states.Inactive).toBeDefined();
      
      // All states should have fullKey with dots
      expect(definition.states['Active.Empty'].fullKey).toBe('Active.Empty');
      expect(definition.states.Inactive.fullKey).toBe('Inactive');
    });
  });

  describe('State matching consistency', () => {
    it('should match active states correctly for hierarchical machines', () => {
      const machine = createCheckoutMachine();
      const definition = buildVisualizerTree(machine);
      
      // Navigate to Payment
      (machine as any).send('proceed'); // Cart -> Shipping
      (machine as any).send('proceed'); // Shipping -> Payment
      
      const activePath = getActiveStatePath(machine);
      
      // Should match the fullKey in the definition
      const paymentState = definition.states.Payment.states.MethodEntry;
      expect(paymentState.fullKey).toBe(activePath);
    });

    it('should match active states correctly for flattened machines', () => {
      const machine = createFlatCheckoutMachine();
      const definition = buildVisualizerTree(machine);
      
      // Navigate to Payment
      (machine as any).send('proceed'); // Cart -> Shipping
      (machine as any).send('proceed'); // Shipping -> Payment
      
      const activePath = getActiveStatePath(machine);
      
      // Should match the fullKey in the definition
      const paymentState = definition.states.Payment.states.MethodEntry;
      expect(paymentState.fullKey).toBe(activePath);
    });
  });
});
