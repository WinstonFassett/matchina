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
  // Mark Authorized as a final/exit state so parent can advance on child.exit
  Authorized: () => ({ final: true }),
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
      Authorized: {},
    },
    "MethodEntry"
  );
  // Ensure child sends are wrapped so exits are detected even on direct child calls
  setup(payment)(propagateSubmachines(payment));

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
        // When payment child exits (e.g., Authorized), advance parent to Review automatically
        "child.exit": "Review",
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
