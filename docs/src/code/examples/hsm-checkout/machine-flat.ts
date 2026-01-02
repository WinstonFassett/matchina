import { defineStates, createFlatMachine } from "matchina";

// Flat state keys with dot notation representing checkout with payment substates
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

export function createFlatCheckoutMachine() {
  return createFlatMachine(states, {
    Cart: { proceed: "Shipping" },
    Shipping: {
      back: "Cart",
      proceed: "Payment.MethodEntry"
    },
    // Parent Payment state - synthetic parent for all Payment.* states
    Payment: {
      back: "Shipping",
      "child.exit": "Review"
    },
    "Payment.MethodEntry": {
      authorize: "Payment.Authorizing"
    },
    "Payment.Authorizing": {
      authRequired: "Payment.AuthChallenge",
      authSucceeded: "Payment.Authorized",
      authFailed: "Payment.AuthorizationError"
    },
    "Payment.AuthChallenge": {
      authSucceeded: "Payment.Authorized",
      authFailed: "Payment.AuthorizationError"
    },
    "Payment.AuthorizationError": {
      retry: "Payment.MethodEntry"
    },
    "Payment.Authorized": {
      // Final state - no transitions
      // child.exit is automatically triggered by withFlattenedChildExit
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
  }, "Cart");
}
