import React, { useContext } from "react";
import { useMachine } from "matchina/react";
import { eventApi } from "matchina";
import type { FactoryMachine } from "matchina";
import { createDeclarativeCheckoutMachine, parseStateKey } from "./machine";

type CheckoutMachine = FactoryMachine<ReturnType<typeof createDeclarativeCheckoutMachine>>;
type CheckoutActions = ReturnType<typeof eventApi<CheckoutMachine>>;

const CheckoutContext = React.createContext<{
  machine: CheckoutMachine;
  actions: CheckoutActions;
} | null>(null);

function useCheckoutContext() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckoutContext must be used within CheckoutContext.Provider');
  }
  return context;
}

interface CheckoutViewProps {
  machine: FactoryMachine<ReturnType<typeof createDeclarativeCheckoutMachine>>;
}

export function CheckoutView({ machine }: CheckoutViewProps) {
  const change = useMachine(machine) as { to: { key: string; data?: any } };
  const state = change.to;

  const parsed = parseStateKey(state.key);
  const parent = parsed.parent;
  const child = parsed.child;

  const actions = eventApi(machine);

  return (
    <CheckoutContext.Provider value={{ machine, actions }}>
      <div className="space-y-6">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          State: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{parsed.full}</span>
        </div>

        {/* Cart State */}
        {parent === 'Cart' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shopping Cart</h3>
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <p className="text-gray-600 dark:text-gray-400">Items in cart...</p>
            </div>
            <button
              onClick={() => actions.proceed?.()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Proceed to Shipping
            </button>
          </div>
        )}

        {/* Shipping State */}
        {parent === 'Shipping' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shipping Information</h3>
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <p className="text-gray-600 dark:text-gray-400">Enter shipping details...</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => actions.back?.()}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Back to Cart
              </button>
              <button
                onClick={() => actions.proceed?.()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {/* Payment States */}
        {parent === 'Payment' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Payment</h3>
            
            {child === 'MethodEntry' && (
              <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Enter payment method...</p>
                <div className="space-x-2">
                  <button
                    onClick={() => actions.authorize?.()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Authorize Payment
                  </button>
                  <button
                    onClick={() => actions.back?.()}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Back to Shipping
                  </button>
                </div>
              </div>
            )}

            {child === 'Authorizing' && (
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">Authorizing payment...</p>
                <div className="space-x-2">
                  <button
                    onClick={() => actions.authRequired?.()}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Challenge Required
                  </button>
                  <button
                    onClick={() => actions.authSucceeded?.()}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => actions.authFailed?.()}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => actions.back?.()}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Back to Shipping
                  </button>
                </div>
              </div>
            )}

            {child === 'AuthChallenge' && (
              <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <p className="text-orange-700 dark:text-orange-300 mb-4">Additional authentication required</p>
                <div className="space-x-2">
                  <button
                    onClick={() => actions.authSucceeded?.()}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => actions.authFailed?.()}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => actions.back?.()}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Back to Shipping
                  </button>
                </div>
              </div>
            )}

            {child === 'AuthorizationError' && (
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-red-700 dark:text-red-300 mb-4">Authorization failed</p>
                <div className="space-x-2">
                  <button
                    onClick={() => actions.retry?.()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry Payment
                  </button>
                  <button
                    onClick={() => actions.back?.()}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Back to Shipping
                  </button>
                </div>
              </div>
            )}

            {child === 'Authorized' && (
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                <p className="text-green-700 dark:text-green-300 mb-4">Payment authorized successfully!</p>
                <div className="space-x-2">
                  <button
                    onClick={() => actions.exit?.()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Continue to Review
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other states... */}
        {parent === 'ShippingPaid' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shipping & Payment Complete</h3>
            <button
              onClick={() => actions.proceed?.()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Review Order
            </button>
          </div>
        )}

        {parent === 'Review' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review Order</h3>
            <button
              onClick={() => actions.submitOrder?.()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Submit Order
            </button>
          </div>
        )}

        {parent === 'Confirmation' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Order Confirmation</h3>
            <button
              onClick={() => actions.restart?.()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Start New Order
            </button>
          </div>
        )}
      </div>
    </CheckoutContext.Provider>
  );
}
