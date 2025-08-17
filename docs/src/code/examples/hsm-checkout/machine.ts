import { createMachine, defineStates, setup } from "matchina";
import { propagateSubmachines } from "../../../../../playground/propagateSubmachines";
import { withSubstates } from "../../../../../playground/withSubstates";

// Parent checkout states and nested payment substates
export const checkoutStates = defineStates({
  Cart: undefined,
  Shipping: undefined,
  // Attach a fresh payment submachine on every entry
  Payment: withSubstates(() => createPayment(), { id: "payment" }),
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

  const base = createMachine(
    checkoutStates,
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
        // No parent proceed; require child to finish
        "child.exit": "Review",
      },
      Review: {
        back: "Shipping",
        submitOrder: "Confirmation",
      },
      Confirmation: {
        restart: "Cart",
      },
    },
    "Cart"
  );
  // Enable child-first routing and child.exit propagation
  setup(base)(propagateSubmachines(base));

  return base;
}
