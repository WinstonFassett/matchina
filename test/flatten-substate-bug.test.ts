import { describe, it, expect } from 'vitest';
import { defineStates, defineMachine, defineSubmachine, flattenMachineDefinition, createMachineFromFlat } from 'matchina';

describe('Flattened HSM Payment State Bug', () => {
  // Reproduce the exact structure from the checkout example
  const paymentStates = defineStates({
    MethodEntry: undefined,
    Authorizing: undefined,
    AuthChallenge: undefined,
    AuthorizationError: undefined,
    Authorized: () => ({ final: true }),
  });

  const paymentMachineDef = defineSubmachine(
    paymentStates,
    {
      MethodEntry: { authorize: "Authorizing" },
      Authorizing: {
        authRequired: "AuthChallenge",
        authSucceeded: "Authorized",
        authFailed: "AuthorizationError"
      },
      AuthChallenge: {
        authSucceeded: "Authorized",
        authFailed: "AuthorizationError"
      },
      AuthorizationError: { retry: "MethodEntry" },
      Authorized: {},
    },
    "MethodEntry"
  );

  const checkoutStates = defineStates({
    Cart: undefined,
    Shipping: undefined,
    ShippingPaid: undefined,
    Payment: paymentMachineDef,
    Review: undefined,
    Confirmation: undefined,
  });

  const hierarchicalDef = defineMachine(
    checkoutStates,
    {
      Cart: { proceed: "Shipping" },
      Shipping: {
        back: "Cart",
        proceed: "Payment"
      },
      Payment: {
        back: "Shipping",
        exit: "Shipping",
        "child.exit": "Review"
      },
      Review: {
        back: "ShippingPaid",
        changePayment: "Payment",
        submitOrder: "Confirmation",
      },
      ShippingPaid: {
        back: "Cart",
        proceed: "Review",
        changePayment: "Payment",
      },
      Confirmation: { restart: "Cart" },
    },
    "Cart"
  );

  it('should properly namespace substate keys in flattened machine', () => {
    const flatDef = flattenMachineDefinition(hierarchicalDef);
    const machine = createMachineFromFlat(flatDef);

    // Navigate to payment substate
    machine.send('proceed'); // Cart -> Shipping
    machine.send('proceed'); // Shipping -> Payment.MethodEntry

    const state = machine.getState();
    
    // The state key should be properly namespaced
    expect(state.key).toBe('Payment.MethodEntry');
    
    // The state data should contain the MatchboxImpl for the substate
    expect(state.data).toBeDefined();
    expect(typeof state.data).toBe('object');
    
    // The embedded MatchboxImpl should have the expected interface
    const paymentSubstate = state.data as any;
    expect(typeof paymentSubstate.getTag).toBe('function');
    expect(typeof paymentSubstate.is).toBe('function');
    expect(typeof paymentSubstate.match).toBe('function');
    
    // The substate should be MethodEntry (without namespace)
    expect(paymentSubstate.getTag()).toBe('MethodEntry');
    expect(paymentSubstate.is('MethodEntry')).toBe(true);
  });

  it('should allow proper state matching on flattened substates', () => {
    const flatDef = flattenMachineDefinition(hierarchicalDef);
    const machine = createMachineFromFlat(flatDef);

    // Navigate to payment substate
    machine.send('proceed'); // Cart -> Shipping
    machine.send('proceed'); // Shipping -> Payment.MethodEntry

    const state = machine.getState();
    const paymentSubstate = state.data as any;

    // Test that the substate's match method works correctly
    const result = paymentSubstate.match({
      MethodEntry: () => 'method-entry',
      Authorizing: () => 'authorizing',
      AuthChallenge: () => 'auth-challenge',
      AuthorizationError: () => 'auth-error',
      Authorized: () => 'authorized',
    });

    expect(result).toBe('method-entry');
  });

  it('should handle transitions within flattened substates', () => {
    const flatDef = flattenMachineDefinition(hierarchicalDef);
    const machine = createMachineFromFlat(flatDef);

    // Navigate to payment substate
    machine.send('proceed'); // Cart -> Shipping
    machine.send('proceed'); // Shipping -> Payment.MethodEntry

    // Transition within the payment substate
    machine.send('authorize'); // MethodEntry -> Authorizing

    const state = machine.getState();
    
    // Should still be in Payment but now in Authorizing substate
    expect(state.key).toBe('Payment.Authorizing');
    
    const paymentSubstate = state.data as any;
    expect(paymentSubstate.getTag()).toBe('Authorizing');
    expect(paymentSubstate.is('Authorizing')).toBe(true);
  });
});
