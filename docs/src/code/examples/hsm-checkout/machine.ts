import { createMachine, defineStates, effect, setup, whenEventType, withReset } from "matchina";
import { propagateSubmachines } from "../../../../../src/nesting/propagateSubmachines";

// Hierarchical checkout: main flow contains a payment submachine
export const paymentStates = defineStates({
  MethodEntry: undefined,
  Authorizing: undefined,
  AuthChallenge: undefined,
  AuthorizationError: undefined,
  Authorized: () => ({ final: true }),
});

function createPayment() {
  const m = createMachine(paymentStates, {
    MethodEntry: { authorize: "Authorizing" },
    Authorizing: { 
      authRequired: "AuthChallenge", 
      authSucceeded: "Authorized", 
      authFailed: "AuthorizationError" 
    },
    AuthChallenge: { authSucceeded: "Authorized", authFailed: "AuthorizationError" },
    AuthorizationError: { retry: "MethodEntry" },
    Authorized: {},
  }, "MethodEntry");
  
  setup(m)(propagateSubmachines(m));
  return withReset(m, paymentStates.MethodEntry());
}

const checkoutStates = defineStates({
  Cart: undefined,
  Shipping: undefined,
  ShippingPaid: undefined,
  Payment: (machine: any) => ({ machine, id: "payment" }),
  Review: undefined,
  Confirmation: undefined,
});

export function createCheckoutMachine() {
  const payment = createPayment();

  const checkout = createMachine({
    ...checkoutStates,
    Payment: () => checkoutStates.Payment(payment),
  }, {
    Cart: { proceed: "Shipping" },
    Shipping: { back: "Cart", proceed: "Payment" },
    Payment: { 
      back: "Shipping", 
      exit: "Shipping", 
      "child.exit": "Review"  // When payment completes, go to review
    },
    Review: {
      back: "ShippingPaid",
      changePayment: () => { payment.reset(); return checkoutStates.Payment(payment); },
      submitOrder: "Confirmation",
    },
    ShippingPaid: {
      back: "Cart", 
      proceed: "Review",
      changePayment: () => { payment.reset(); return checkoutStates.Payment(payment); },
    },
    Confirmation: { restart: "Cart" },
  }, "Cart");

  setup(checkout)(
    propagateSubmachines(checkout),
    effect(whenEventType("restart", payment.reset))
  );

  return Object.assign(checkout, { payment });
}
