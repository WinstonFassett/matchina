import { createMachine, defineStates, effect, setup, withReset, createHierarchicalMachine } from "matchina";
import { defineMachine, createMachineFrom } from "matchina";
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
  MethodEntry: { authorize: { to: "Authorizing", handle: () => paymentStates.Authorizing() } },
  Authorizing: {
    authRequired: { to: "AuthChallenge", handle: () => paymentStates.AuthChallenge() },
    authSucceeded: { to: "Authorized", handle: () => paymentStates.Authorized() },
    authFailed: { to: "AuthorizationError", handle: () => paymentStates.AuthorizationError() }
  },
  AuthChallenge: {
    authSucceeded: { to: "Authorized", handle: () => paymentStates.Authorized() },
    authFailed: { to: "AuthorizationError", handle: () => paymentStates.AuthorizationError() }
  },
  AuthorizationError: { retry: { to: "MethodEntry", handle: () => paymentStates.MethodEntry() } },
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
    Cart: { proceed: { to: "Shipping", handle: () => checkoutStates.Shipping() } },
    Shipping: {
      back: { to: "Cart", handle: () => checkoutStates.Cart() },
      proceed: "Payment"
    },
    Payment: {
      back: { to: "Shipping", handle: () => checkoutStates.Shipping() },
      exit: { to: "Shipping", handle: () => checkoutStates.Shipping() },
      "child.exit": { to: "Review", handle: () => checkoutStates.Review() }
    },
    Review: {
      back: { to: "ShippingPaid", handle: () => checkoutStates.ShippingPaid() },
      changePayment: "Payment",
      submitOrder: { to: "Confirmation", handle: () => checkoutStates.Confirmation() },
    },
    ShippingPaid: {
      back: { to: "Cart", handle: () => checkoutStates.Cart() },
      proceed: { to: "Review", handle: () => checkoutStates.Review() },
      changePayment: "Payment",
    },
    Confirmation: { restart: { to: "Cart", handle: () => checkoutStates.Cart() } },
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
