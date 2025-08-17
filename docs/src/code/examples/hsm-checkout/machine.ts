import { createMachine, defineStates, setup } from "matchina";
import { propagateSubmachines } from "../../../../../playground/propagateSubmachines";
import { withSubstates } from "../../../../../playground/withSubstates";

export const checkoutStates = defineStates({
  Cart: undefined,
  Shipping: undefined,
  Payment: undefined,
  Review: undefined,
  Confirmation: undefined,
});

export const paymentStates = defineStates({
  MethodEntry: undefined,
  Authorizing: undefined,
  AuthChallenge: undefined,
  AuthorizationError: undefined,
  Authorized: () => ({ final: true }),
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
  setup(m)(propagateSubmachines(m));
  return m;
}

const states = defineStates({
  Cart: undefined,
  Shipping: undefined,
  ShippingPaid: undefined,
  Payment: (machine: any) => ({ machine, id: "payment" }),
  Review: undefined,
  Confirmation: undefined,
});

export function createCheckoutMachine() {
  const payment = createPayment();

  const base = createMachine(
    {
      ...states,
      Payment: () => states.Payment(payment),
    },
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
