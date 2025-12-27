import { defineStates, createFlatMachine } from "matchina";

// Flat state keys with dot notation representing checkout with payment substates
const states = defineStates({
  Cart: () => ({}),
  Shipping: () => ({}),
  ShippingPaid: () => ({}),

  // Flattened payment substates
  "Payment.MethodEntry": () => ({}),
  "Payment.Authorizing": () => ({}),
  "Payment.AuthChallenge": () => ({}),
  "Payment.AuthorizationError": () => ({}),
  "Payment.Authorized": () => ({ final: true }),

  Review: () => ({}),
  Confirmation: () => ({}),
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
      exit: "Shipping",
      "child.exit": "Review"
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

// Helper to parse hierarchical state key
export function parseFlatStateKey(key: string) {
  const parts = key.split(".");
  return {
    parent: parts[0],
    child: parts[1] || null,
    full: key,
  };
}
