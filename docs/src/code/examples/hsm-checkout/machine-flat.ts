import { describeHSM } from "matchina/hsm";

export function createFlatCheckoutMachine() {
  return describeHSM({
    initial: "Cart",
    states: {
      Cart: {
        on: { proceed: "Shipping" }
      },
      Shipping: {
        on: {
          back: "Cart",
          proceed: "Payment"
        }
      },
      Payment: {
        initial: "MethodEntry",
        states: {
          MethodEntry: {
            on: { authorize: "Authorizing" }
          },
          Authorizing: {
            on: {
              authRequired: "AuthChallenge",
              authSucceeded: "Authorized",
              authFailed: "AuthorizationError"
            }
          },
          AuthChallenge: {
            on: {
              authSucceeded: "Authorized",
              authFailed: "AuthorizationError"
            }
          },
          AuthorizationError: {
            on: { retry: "MethodEntry" }
          },
          Authorized: {
            // Final payment state - child.exit automatically triggered
          }
        },
        on: {
          back: "Shipping",
          "child.exit": "Review"
        }
      },
      Review: {
        on: {
          back: "ShippingPaid",
          changePayment: "Payment",
          submitOrder: "Confirmation"
        }
      },
      ShippingPaid: {
        on: {
          back: "Cart",
          proceed: "Review",
          changePayment: "Payment"
        }
      },
      Confirmation: {
        on: { restart: "Cart" }
      }
    }
  });
}
