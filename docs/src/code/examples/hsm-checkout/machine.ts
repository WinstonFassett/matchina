import { createMachine, defineStates, effect, setup, withReset, createHierarchicalMachine, defineMachine, submachine } from "matchina";

// Hierarchical checkout: main flow contains a payment submachine
export const paymentStates = defineStates({
  MethodEntry: undefined,
  Authorizing: undefined,
  AuthChallenge: undefined,
  AuthorizationError: undefined,
  Authorized: () => ({ final: true }),
});

// Define payment machine declaratively
const paymentDef = defineMachine(paymentStates, {
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
}, "MethodEntry");

// Factory with .def attached (from defineMachine)
const createPaymentBase = paymentDef.factory;

// Wrapper to add reset capability
function createPayment() {
  const m = createPaymentBase();
  // Cast to any to avoid "argument of type 'any' is not assignable to parameter of type 'never'"
  // This happens because of complex type inference with withReset + createHierarchicalMachine
  return withReset(createHierarchicalMachine(m) as any, paymentStates.MethodEntry());
}
// Attach def for visualization
createPayment.def = paymentDef;

const paymentFactory = submachine(createPayment, { id: "payment" });

const checkoutStates = defineStates({
  Cart: undefined,
  Shipping: undefined,
  ShippingPaid: undefined,
  Payment: paymentFactory,
  Review: undefined,
  Confirmation: undefined,
});

export function createCheckoutMachine() {
  let checkout: any;
  let hierarchical: any;

  checkout = createMachine(checkoutStates, {
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
  }, checkoutStates.Cart());

  hierarchical = createHierarchicalMachine(checkout);

  return hierarchical;
}

export type Machine = ReturnType<typeof createCheckoutMachine>;
