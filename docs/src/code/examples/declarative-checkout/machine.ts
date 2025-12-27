/**
 * Declarative Checkout Machine Example
 *
 * This example demonstrates the new createDeclarativeFlatMachine API
 * which provides an elegant, DRY way to define hierarchical state machines
 * that are flattened internally.
 *
 * Key benefits:
 * - Define hierarchy ONCE (no repetitive dot-notation)
 * - Auto-flattens to dot-notation internally
 * - Generates synthetic parent states automatically
 * - Type inference works (transitions inline with creation)
 * - DRY and elegant
 */

import { createDeclarativeFlatMachine } from "matchina";

export function createDeclarativeCheckoutMachine() {
  return createDeclarativeFlatMachine({
    initial: 'Cart',
    states: {
      // Simple states at root level
      Cart: {
        data: () => ({}),
        on: {
          proceed: 'Shipping'
        }
      },

      Shipping: {
        data: () => ({}),
        on: {
          back: 'Cart',
          proceed: 'Payment'  // Auto-resolves to Payment.MethodEntry
        }
      },

      // Hierarchical state with children
      Payment: {
        initial: 'MethodEntry',  // Specify which child state to enter
        states: {
          // Child states use relative transitions
          MethodEntry: {
            data: () => ({}),
            on: {
              authorize: 'Authorizing',  // Resolves to Payment.Authorizing
              back: '^Shipping'  // ^ escapes to parent level
            }
          },

          Authorizing: {
            data: () => ({}),
            on: {
              authRequired: 'AuthChallenge',
              authSucceeded: 'Authorized',
              authFailed: 'AuthorizationError',
              back: '^Shipping'  // All children can go back
            }
          },

          AuthChallenge: {
            data: () => ({}),
            on: {
              authSucceeded: 'Authorized',
              authFailed: 'AuthorizationError',
              back: '^Shipping'
            }
          },

          AuthorizationError: {
            data: () => ({}),
            on: {
              retry: 'MethodEntry',
              back: '^Shipping'
            }
          },

          Authorized: {
            data: () => ({}),
            final: true  // Automatically triggers parent's child.exit
          }
        },
        // Parent-level transitions apply to all children
        on: {
          back: '^Shipping',  // Shared by all payment states
          exit: '^Shipping',
          'child.exit': '^Review'  // When Authorized (final) is reached
        }
      },

      ShippingPaid: {
        data: () => ({}),
        on: {
          back: 'Cart',
          proceed: 'Review',
          changePayment: 'Payment'  // Back to payment entry
        }
      },

      Review: {
        data: () => ({}),
        on: {
          back: 'ShippingPaid',
          changePayment: 'Payment',
          submitOrder: 'Confirmation'
        }
      },

      Confirmation: {
        data: () => ({}),
        on: {
          restart: 'Cart'
        }
      }
    }
  });
}

// Helper to parse flat state keys for display
export function parseStateKey(key: string) {
  const parts = key.split('.');
  return {
    parent: parts[0],
    child: parts[1] || null,
    full: key
  };
}
