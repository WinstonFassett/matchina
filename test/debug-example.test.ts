import { describe, it, expect } from 'vitest';
import { createFlatCheckoutMachine } from '../docs/src/code/examples/hsm-checkout/machine-flat';

// Test exactly like the example does
describe('Debug Example Issue', () => {
  it('should debug the exact example scenario', () => {
    const machine = createFlatCheckoutMachine();
    
    // Navigate to payment exactly like in the example
    machine.send('proceed'); // Cart -> Shipping
    machine.send('proceed'); // Shipping -> Payment.MethodEntry
    
    const state = machine.getState();
    console.log('=== DEBUG INFO ===');
    console.log('Current state key:', state.key);
    console.log('State:', state);
    console.log('State data:', state.data);
    console.log('State data type:', typeof state.data);
    
    // Check if machine has original definition
    console.log('Machine has _originalDef:', !!(machine as any)._originalDef);
    
    // Import and test the actual function used in the example
    const { getXStateDefinition } = require('../docs/src/code/examples/lib/matchina-machine-to-xstate-definition');
    
    try {
      const definition = getXStateDefinition(machine);
      console.log('Definition created successfully');
      console.log('Payment states:', Object.keys(definition.states.Payment?.states || {}));
      
      const methodEntryState = definition.states.Payment?.states?.MethodEntry;
      if (methodEntryState) {
        console.log('MethodEntry fullKey:', methodEntryState.fullKey);
        console.log('MethodEntry state config:', methodEntryState);
      }
    } catch (error) {
      console.error('Error getting definition:', error);
    }
    
    // Test the SketchInspector logic directly
    const fullPath = (() => {
      const stateKey = state?.key || '';
      if (stateKey.includes('.')) {
        return stateKey;
      }
      return 'fallback';
    })();
    
    console.log('SketchInspector fullPath:', fullPath);
    
    // Test what the SketchInspector would try to match
    let definition = null;
    try {
      definition = getXStateDefinition(machine);
      const methodEntryState = definition.states.Payment?.states?.MethodEntry;
      if (methodEntryState) {
        const isMatch = methodEntryState.fullKey === fullPath;
        console.log('Is MethodEntry matching?', isMatch);
        console.log('fullKey:', methodEntryState.fullKey);
        console.log('fullPath:', fullPath);
      }
    } catch (error) {
      console.error('Error in matching test:', error);
    }
  });
});
