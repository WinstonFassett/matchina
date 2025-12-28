import { describe, it, expect } from 'vitest';
import { defineStates, createFlatMachine } from 'matchina';

describe('Flattened HSM Payment State Bug', () => {
  // Flat state keys with dot notation
  const states = defineStates({
    Cart: undefined,
    Shipping: undefined,
    ShippingPaid: undefined,

    // Flattened payment substates
    "Payment.MethodEntry": undefined,
    "Payment.Authorizing": undefined,
    "Payment.AuthChallenge": undefined,
    "Payment.AuthorizationError": undefined,
    "Payment.Authorized": { final: true },

    Review: undefined,
    Confirmation: undefined,
  });

  const transitions = {
    Cart: { proceed: "Shipping" },
    Shipping: {
      back: "Cart",
      proceed: "Payment.MethodEntry"
    },
    "Payment.MethodEntry": {
      authorize: "Payment.Authorizing",
      back: "Shipping"
    },
    "Payment.Authorizing": {
      authRequired: "Payment.AuthChallenge",
      authSucceeded: "Payment.Authorized",
      authFailed: "Payment.AuthorizationError",
      back: "Shipping"
    },
    "Payment.AuthChallenge": {
      authSucceeded: "Payment.Authorized",
      authFailed: "Payment.AuthorizationError",
      back: "Shipping"
    },
    "Payment.AuthorizationError": {
      retry: "Payment.MethodEntry",
      back: "Shipping"
    },
    "Payment.Authorized": {
      proceed: "Review",
      back: "Shipping"
    },
    Review: {
      back: "ShippingPaid",
      changePayment: "Payment.MethodEntry",
      submitOrder: "Confirmation",
    },
    ShippingPaid: {
      back: "Cart",
      proceed: "Review",
      changePayment: "Payment.MethodEntry",
    },
    Confirmation: { restart: "Cart" },
  };

  it('should properly namespace substate keys in flattened machine', () => {
    const machine = createFlatMachine(states as any, transitions as any, "Cart");

    // Navigate to payment substate
    (machine as any).send('proceed'); // Cart -> Shipping
    (machine as any).send('proceed'); // Shipping -> Payment.MethodEntry

    const state = machine.getState();
    
    // The state key should be properly namespaced
    expect(state.key).toBe('Payment.MethodEntry');
    
    // The state data should be undefined (as defined in states)
    expect(state.data).toBeUndefined();
  });

  it('should handle transitions within flattened substates', () => {
    const machine = createFlatMachine(states as any, transitions as any, "Cart");

    // Navigate to payment substate
    (machine as any).send('proceed'); // Cart -> Shipping
    (machine as any).send('proceed'); // Shipping -> Payment.MethodEntry

    // Transition within the payment substate
    (machine as any).send('authorize'); // MethodEntry -> Authorizing

    const state = machine.getState();
    
    // Should now be in Payment.Authorizing
    expect(state.key).toBe('Payment.Authorizing');
  });

  it('should have shape metadata for visualization', () => {
    const machine = createFlatMachine(states as any, transitions as any, "Cart");
    
    // Shape should be attached
    expect((machine as any).shape).toBeDefined();
    
    const shape = (machine as any).shape.getState();
    expect(shape).toBeDefined();
    expect(shape.states).toBeDefined();
    expect(shape.hierarchy).toBeDefined();
  });
});
