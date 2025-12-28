import { describe, it, expect } from 'vitest';
import { createFlatCheckoutMachine } from '../docs/src/code/examples/hsm-checkout/machine-flat';
import { withFlattenedChildExit } from '../src/nesting/flattened-child-exit';

describe('Flattened child exit behavior', () => {
  it('should have correct transition structure in flattened machine', () => {
    const machine = createFlatCheckoutMachine();
    
    // Check that Payment.Authorized has NO transitions (should be empty or undefined)
    const authorizedTransitions = machine.transitions['Payment.Authorized'];
    expect(authorizedTransitions || {}).toEqual({});
    
    // Check that Payment parent has the expected transitions
    const paymentTransitions = machine.transitions['Payment'];
    expect(Object.keys(paymentTransitions)).toEqual(['back', 'exit', 'child.exit']);
    expect(paymentTransitions['child.exit']).toBe('Review');
  });

  it('should automatically trigger child.exit when reaching final child state', async () => {
    const baseMachine = createFlatCheckoutMachine();
    // Apply auto-exit (parent fallback is now automatic in createMachineFromFlat)
    const machine = withFlattenedChildExit(baseMachine);

    // Navigate to Payment.Authorized (final child state)
    machine.send('proceed'); // Cart -> Shipping
    expect(machine.getState().key).toBe('Shipping');

    machine.send('proceed'); // Shipping -> Payment.MethodEntry
    expect(machine.getState().key).toBe('Payment.MethodEntry');

    machine.send('authorize'); // Payment.MethodEntry -> Payment.Authorizing
    expect(machine.getState().key).toBe('Payment.Authorizing');

    machine.send('authSucceeded'); // Payment.Authorizing -> Payment.Authorized
    expect(machine.getState().key).toBe('Payment.Authorized');

    // Wait for microtask to process child.exit
    await Promise.resolve();

    // Should automatically transition to Review via child.exit
    expect(machine.getState().key).toBe('Review');
  });

  it('should handle manual child.exit from final child state', () => {
    // Parent fallback is now automatic in createMachineFromFlat
    const machine = createFlatCheckoutMachine();
    
    // Navigate to Payment.Authorized
    machine.send('proceed'); // Cart -> Shipping
    machine.send('proceed'); // Shipping -> Payment.MethodEntry
    machine.send('authorize'); // Payment.MethodEntry -> Payment.Authorizing
    machine.send('authSucceeded'); // Payment.Authorizing -> Payment.Authorized
    
    expect(machine.getState().key).toBe('Payment.Authorized');
    
    // Manual child.exit should work with parent fallback
    machine.send('child.exit');
    
    // This should transition to Review
    expect(machine.getState().key).toBe('Review');
  });
});
