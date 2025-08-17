import { createMachine, defineStates, setup } from "matchina";
import { propagateSubmachines } from "../../../../../playground/propagateSubmachines";

// Parent checkout states and nested payment substates
export const checkoutStates = defineStates({
  Cart: undefined,
  Shipping: undefined,
  // Carry the child payment machine while in Payment so propagation can find it
  Payment: (props: { machine: any }) => props,
  Review: undefined,
  Confirmation: undefined,
});

export const paymentStates = defineStates({
  MethodEntry: undefined,
  Authorizing: undefined,
  AuthChallenge: undefined,
  Authorized: undefined,
  AuthorizationError: undefined,
});

export function createCheckoutMachine() {
  // Create child first so we can embed it in Payment state data
  const payment = createMachine(
    paymentStates,
    {
      MethodEntry: { authorize: "Authorizing" },
      Authorizing: { authRequired: "AuthChallenge", authSucceeded: "Authorized", authFailed: "AuthorizationError" },
      AuthChallenge: { authSucceeded: "Authorized", authFailed: "AuthorizationError" },
      AuthorizationError: { retry: "MethodEntry" },
      Authorized: { retry: "MethodEntry" },
    },
    "MethodEntry"
  );

  const base = createMachine(
    checkoutStates,
    {
      Cart: {
        proceed: "Shipping",
      },
      Shipping: {
        back: "Cart",
        proceed: () => () => checkoutStates.Payment({ machine: payment }),
      },
      Payment: {
        back: "Shipping",
        proceed: "Review", // Gate in the view based on payment submachine
      },
      Review: {
        // back: () => () => checkoutStates.Payment({ machine: payment }),
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

  return Object.assign(base, { payment });
}
