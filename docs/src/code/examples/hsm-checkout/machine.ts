import { createMachine, defineStates, effect, setup, withReset, createHierarchicalMachine } from "matchina";
import { defineMachine } from "matchina";
import { submachine } from "../../../../../src/nesting/submachine";

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
  return withReset(createHierarchicalMachine(m), paymentStates.MethodEntry());
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
  const checkout = createMachine(checkoutStates, {
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
  }, "Cart");

  const hierarchical = createHierarchicalMachine(checkout);

  // Get payment machine from state to wire up reset effect
  const getPayment = () => {
    const state = hierarchical.getState();
    return state.is("Payment") ? state.data.machine : null;
  };

  setup(hierarchical)(
    effect((ev: any) => {
      if (ev.type === "restart") {
        const payment = getPayment();
        payment?.reset();
        return true;
      }
    })
  );

  return hierarchical;
}
