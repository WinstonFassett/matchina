import {
  defineStates,
  defineMachine,
  defineSubmachine,
  flattenMachineDefinition,
  createMachineFromFlat
} from "matchina";

// Hierarchical checkout: main flow contains a payment submachine
const paymentStates = defineStates({
  MethodEntry: undefined,
  Authorizing: undefined,
  AuthChallenge: undefined,
  AuthorizationError: undefined,
  Authorized: () => ({ final: true }),
});

// Define payment machine as submachine
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

// Define the checkout states with payment submachine
const checkoutStates = defineStates({
  Cart: undefined,
  Shipping: undefined,
  ShippingPaid: undefined,
  Payment: paymentMachineDef,
  Review: undefined,
  Confirmation: undefined,
});

// Define the hierarchical machine
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

// Flatten and create the machine
const flatDef = flattenMachineDefinition(hierarchicalDef);

export function createFlatCheckoutMachine() {
  return createMachineFromFlat(flatDef);
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
