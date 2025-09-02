import { createMachine, defineStates, effect, setup, whenEventType, withReset, createHierarchicalMachine } from "matchina";

// Hierarchical checkout: main flow contains a payment submachine
export const paymentStates = defineStates({
  MethodEntry: undefined,
  Authorizing: undefined,
  AuthChallenge: undefined,
  AuthorizationError: undefined,
  Authorized: () => ({ final: true }),
});

function createPayment() {
  const m = createMachine(paymentStates, {
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
  
  return withReset(createHierarchicalMachine(m), paymentStates.MethodEntry());
}

const checkoutStates = defineStates({
  Cart: undefined,
  Shipping: undefined,
  ShippingPaid: undefined,
  Payment: (machine: ReturnType<typeof createPayment>) => ({ machine, id: "payment" }),
  Review: undefined,
  Confirmation: undefined,
});

export function createCheckoutMachine() {
  const payment = createPayment();

  const checkout = createMachine({
    ...checkoutStates,
    Payment: () => checkoutStates.Payment(payment),
  }, {
    Cart: { proceed: { to: "Shipping", handle: () => checkoutStates.Shipping() } },
    Shipping: { 
      back: { to: "Cart", handle: () => checkoutStates.Cart() }, 
      // Always reset payment when (re)entering Payment from Shipping
      proceed: { to: "Payment", handle: () => { payment.reset(); return checkoutStates.Payment(payment); } } 
    },
    Payment: { 
      back: { to: "Shipping", handle: () => checkoutStates.Shipping() }, 
      exit: { to: "Shipping", handle: () => checkoutStates.Shipping() }, 
      "child.exit": { to: "Review", handle: () => checkoutStates.Review() }  // When payment completes, go to review
    },
    Review: {
      back: { to: "ShippingPaid", handle: () => checkoutStates.ShippingPaid() },
      changePayment: { to: "Payment", handle: () => { payment.reset(); return checkoutStates.Payment(payment); } },
      submitOrder: { to: "Confirmation", handle: () => checkoutStates.Confirmation() },
    },
    ShippingPaid: {
      back: { to: "Cart", handle: () => checkoutStates.Cart() }, 
      proceed: { to: "Review", handle: () => checkoutStates.Review() },
      changePayment: { to: "Payment", handle: () => { payment.reset(); return checkoutStates.Payment(payment); } },
    },
    Confirmation: { restart: { to: "Cart", handle: () => checkoutStates.Cart() } },
  }, "Cart");

  const hierarchical = createHierarchicalMachine(checkout);
  
  setup(hierarchical)(
    effect((ev: any) => ev.type === "restart" && (payment.reset(), true))
  );

  return Object.assign(hierarchical, { payment });
}
