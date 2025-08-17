import { createMachine, defineStates, setup } from "matchina";
import { propagateSubmachines } from "../../../../../playground/propagateSubmachines";
import { withSubstates } from "../../../../../playground/withSubstates";

// Parent checkout states and nested payment substates
export const checkoutStates = defineStates({
  Cart: undefined,
  Shipping: undefined,
  // When user has already paid and navigates back, we land here to remember that fact
  ShippingPaid: undefined,
  // Attach a fresh payment submachine on every entry
  Payment: undefined, // placeholder; wired below where we have the instance
  Review: undefined,
  Confirmation: undefined,
});

export const paymentStates = defineStates({
  MethodEntry: undefined,
  Authorizing: undefined,
  AuthChallenge: undefined,
  // Mark Authorized as a final/exit state so parent can advance on child.exit
  Authorized: () => ({ final: true }),
  AuthorizationError: undefined,
});

function createPayment() {
  const m = createMachine(
    paymentStates,
    {
      MethodEntry: { authorize: "Authorizing" },
      Authorizing: { authRequired: "AuthChallenge", authSucceeded: "Authorized", authFailed: "AuthorizationError" },
      AuthChallenge: { authSucceeded: "Authorized", authFailed: "AuthorizationError" },
      AuthorizationError: { retry: "MethodEntry" },
      Authorized: {},
    },
    "MethodEntry"
  );
  // Optionally wrap child too (not strictly required for exit detection via parent wrapper,
  // but keeps behavior consistent if called directly)
  setup(m)(propagateSubmachines(m));
  return m;
}

export function createCheckoutMachine() {
  const payment = createPayment();

  const states = defineStates({
    Cart: undefined,
    Shipping: undefined,
    ShippingPaid: undefined,
    Payment: withSubstates(() => payment, { id: "payment" }),
    Review: undefined,
    Confirmation: undefined,
  });

  const base = createMachine(
    states,
    {
      Cart: {
        proceed: "Shipping",
      },
      Shipping: {
        back: "Cart",
        proceed: "Payment",
      },
      Payment: {
        back: "Shipping",
        "child.exit": "Review",
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
      Confirmation: {
        restart: "Cart",
      },
    },
    "Cart"
  );
  setup(base)(propagateSubmachines(base));

  return Object.assign(base, { payment });
}
