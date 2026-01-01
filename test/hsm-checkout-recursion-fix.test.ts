import { describe, it, expect } from 'vitest';
import { createCheckoutMachine } from '../docs/src/code/examples/hsm-checkout/machine';

describe('HSM Checkout Recursion Fix', () => {
  it('should not cause infinite recursion when payment is approved', () => {
    const machine = createCheckoutMachine();
    
    // Navigate to payment state
    machine.send('proceed'); // Cart -> Shipping
    machine.send('proceed'); // Shipping -> Payment
    
    // Verify we're in payment state
    expect(machine.getState().key).toBe('Payment');
    
    // Navigate through payment flow to authorization
    const paymentMachine = machine.getState().data.machine;
    paymentMachine.send('authorize'); // MethodEntry -> Authorizing
    paymentMachine.send('authSucceeded'); // Authorizing -> Authorized (final)
    
    // This should trigger child.exit and transition to Review
    // Before the fix, this would cause infinite recursion
    expect(machine.getState().key).toBe('Review');
  });

  it('should handle payment auth challenge flow without recursion', () => {
    const machine = createCheckoutMachine();
    
    // Navigate to payment state
    machine.send('proceed'); // Cart -> Shipping
    machine.send('proceed'); // Shipping -> Payment
    
    // Navigate through payment challenge flow
    const paymentMachine = machine.getState().data.machine;
    paymentMachine.send('authorize'); // MethodEntry -> Authorizing
    paymentMachine.send('authRequired'); // Authorizing -> AuthChallenge
    paymentMachine.send('authSucceeded'); // AuthChallenge -> Authorized (final)
    
    // This should trigger child.exit and transition to Review
    expect(machine.getState().key).toBe('Review');
  });

  it('should handle payment retry flow without recursion', () => {
    const machine = createCheckoutMachine();
    
    // Navigate to payment state
    machine.send('proceed'); // Cart -> Shipping
    machine.send('proceed'); // Shipping -> Payment
    
    // Navigate through payment failure and retry
    const paymentMachine = machine.getState().data.machine;
    paymentMachine.send('authorize'); // MethodEntry -> Authorizing
    paymentMachine.send('authFailed'); // Authorizing -> AuthorizationError
    paymentMachine.send('retry'); // AuthorizationError -> MethodEntry
    
    // Should be back at payment MethodEntry
    expect(machine.getState().key).toBe('Payment');
    expect(paymentMachine.getState().key).toBe('MethodEntry');
    
    // Now complete successfully
    paymentMachine.send('authorize'); // MethodEntry -> Authorizing
    paymentMachine.send('authSucceeded'); // Authorizing -> Authorized (final)
    
    // This should trigger child.exit and transition to Review
    expect(machine.getState().key).toBe('Review');
  });
});
