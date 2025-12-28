import { createMachine, defineStates, effect, setup, withReset, matchina } from "matchina";
import { submachine, makeHierarchical } from "matchina/hsm";

// Hierarchical checkout: main flow contains a payment submachine
export const paymentStates = defineStates({
  MethodEntry: undefined,
  Authorizing: undefined,
  AuthChallenge: undefined,
  AuthorizationError: undefined,
  Authorized: { final: true },
});

// Create payment machine factory
function createPayment() {
  const m = matchina(paymentStates, {
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
  }, paymentStates.MethodEntry());

  return withReset(makeHierarchical(m), paymentStates.MethodEntry());
}

const paymentFactory = submachine(createPayment, { id: "payment" });

const checkoutStates = defineStates({
  Cart: () => ({}),
  Shipping: () => ({}),
  ShippingPaid: () => ({}),
  Payment: paymentFactory,
  Review: () => ({}),
  Confirmation: () => ({}),
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

  const hierarchical = makeHierarchical(checkout);

  // Get payment machine from state to wire up reset effect
  const getPayment = () => {
    const state = hierarchical.getState();
    return state.is("Payment") ? state.data.machine : null;
  };

  setup(hierarchical)(
    effect((ev) => {
      if (ev.type === "restart") {
        const payment = getPayment();
        payment?.reset();
        return true;
      }
    })
  );

  return hierarchical;
}
