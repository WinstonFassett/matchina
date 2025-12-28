import React, { useContext } from "react";
import { useMachine } from "matchina/react";
import { eventApi } from "matchina";
import { parseFlatStateKey } from "matchina/nesting";
import { createFlatCheckoutMachine } from "./machine-flat";

// Type the machine and its actions
type CheckoutMachine = ReturnType<typeof createFlatCheckoutMachine>;
type CheckoutActions = ReturnType<typeof eventApi<CheckoutMachine>>;

// Context to share the payment machine and event APIs
const CheckoutContext = React.createContext<{
  machine: CheckoutMachine;
  actions: CheckoutActions;
}>({} as any);

function useCheckoutContext() {
  return useContext(CheckoutContext);
}

interface CheckoutViewFlatProps {
  machine: CheckoutMachine;
}

export function CheckoutViewFlat({ machine }: CheckoutViewFlatProps) {
  const change = useMachine(machine) as { to: { key: string; data?: any } };
  const state = change.to;

  // Parse flattened state
  const parsed = parseFlatStateKey(state.key);
  const parent = parsed.parent;
  const child = parsed.child;

  // Create event APIs
  const actions = eventApi(machine);

  const contextValue = { machine, actions };

  return (
    <CheckoutContext.Provider value={contextValue}>
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Checkout Flow (Flattened)</h3>
        
        <div className="space-y-6">
          <CheckoutSteps currentStep={parent} />
          <PaymentSection parsed={parsed} />
          <CheckoutControls />

          <div className="text-xs text-gray-500 dark:text-gray-400">
            State: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
              {child ? `${parent}.${child}` : parent}
            </span>
          </div>
        </div>
      </div>
    </CheckoutContext.Provider>
  );
}

function CheckoutSteps({ currentStep }: { currentStep: string }) {
  const steps = [
    { key: "Cart", label: "Cart" },
    { key: "Shipping", label: "Shipping" },
    { key: "Payment", label: "Payment" },
    { key: "Review", label: "Review" },
    { key: "Confirmation", label: "Confirmation" },
  ];

  const currentIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className="flex items-center justify-between overflow-x-auto pb-2">
      <div className="flex items-center min-w-max">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentIndex
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              {index + 1}
            </div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{step.label}</span>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 shrink-0 ${
                  index < currentIndex ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentSection({ parsed }: { parsed: { parent: string; child: string | null } }) {
  const { machine } = useCheckoutContext();
  const state = machine.getState();

  // Handle flattened payment states
  const stateKey = state.key;
  if (stateKey.startsWith('Payment.')) {
    return <PaymentFlow parsed={parsed} />;
  }
  
  return null;
}

function PaymentFlow({ parsed }: { parsed: { parent: string; child: string | null } }) {
  const { machine } = useCheckoutContext();
  
  // In flattened mode, the payment state is embedded in the main state's data
  const mainState = machine.getState();
  let paymentState;
  
  if (mainState.data && typeof mainState.data === 'object' && 'getTag' in mainState.data) {
    // Extract the actual payment state from the MatchboxImpl
    paymentState = mainState.data;
  } else {
    // Fallback: use the main state directly
    paymentState = mainState;
  }

  if (!paymentState) return null;
  
  // Use the main machine's actions for flattened mode
  const paymentActions = eventApi(machine);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Payment Method</h4>
      
      <div className="space-y-3">
        {paymentState.match({
          "Payment.MethodEntry": () => (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Select payment method</p>
              <button
                onClick={() => paymentActions.authorize?.()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Authorize Payment
              </button>
            </div>
          ),
          "Payment.Authorizing": () => (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Authorizing...</span>
            </div>
          ),
          "Payment.AuthChallenge": () => (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Additional authentication required</p>
              <div className="space-x-2">
                <button
                  onClick={() => paymentActions.authSucceeded?.()}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => paymentActions.authFailed?.()}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Deny
                </button>
              </div>
            </div>
          ),
          "Payment.AuthorizationError": () => (
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">Authorization failed</p>
              <button
                  onClick={() => paymentActions.retry?.()}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Retry
                </button>
            </div>
          ),
          "Payment.Authorized": () => (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Payment Authorized</span>
            </div>
          ),
        }, null)}
      </div>

      {/* Payment Simulation Controls - only show when authorizing */}
      {parsed.child === 'Authorizing' && (
        <PaymentSimulationControls paymentActions={paymentActions} />
      )}
    </div>
  );
}

function PaymentSimulationControls({ paymentActions }: { paymentActions: CheckoutActions }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Simulation</h5>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => paymentActions.authSucceeded?.()}
          className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          Approve (Success)
        </button>
        <button
          onClick={() => paymentActions.authFailed?.()}
          className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Deny (Challenge)
        </button>
        <button
          onClick={() => paymentActions.retry?.()}
          className="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Retry Failed
        </button>
        <button
          onClick={() => {
            // Simulate a network error by setting an invalid state
            console.log('Simulating payment network error...');
            // This would typically trigger an AuthorizationError state in a real implementation
            paymentActions.retry?.();
          }}
          className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Network Error
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Simulate payment outcomes: approve, deny, retry failed attempts, or network errors
      </p>
    </div>
  );
}

function CheckoutControls() {
  const { actions } = useCheckoutContext();
  const { machine } = useCheckoutContext();
  const state = machine.getState();

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {state.match({
        Cart: () => (
          <button
            onClick={() => actions.proceed?.()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Proceed to Shipping
          </button>
        ),
        Shipping: () => (
          <>
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
          </>
        ),
        // Handle flattened payment states
        "Payment.MethodEntry": () => (
          <>
            <button
              onClick={() => actions.back?.()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Shipping
            </button>
            <button
              onClick={() => actions.exit?.()}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Exit Payment
            </button>
          </>
        ),
        "Payment.Authorizing": () => (
          <>
            <button
              onClick={() => actions.back?.()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Shipping
            </button>
            <button
              onClick={() => actions.exit?.()}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Exit Payment
            </button>
          </>
        ),
        "Payment.AuthChallenge": () => (
          <>
            <button
              onClick={() => actions.back?.()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Shipping
            </button>
            <button
              onClick={() => actions.exit?.()}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Exit Payment
            </button>
          </>
        ),
        "Payment.AuthorizationError": () => (
          <>
            <button
              onClick={() => actions.back?.()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Shipping
            </button>
            <button
              onClick={() => actions.exit?.()}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Exit Payment
            </button>
          </>
        ),
        "Payment.Authorized": () => (
          <>
            <button
              onClick={() => actions.back?.()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Shipping
            </button>
            <button
              onClick={() => actions.exit?.()}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Exit Payment
            </button>
          </>
        ),
        Review: () => (
          <>
            <button
              onClick={() => actions.back?.()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Shipping
            </button>
            <button
              onClick={() => actions.changePayment?.()}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Change Payment
            </button>
            <button
              onClick={() => actions.submitOrder?.()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Submit Order
            </button>
          </>
        ),
        ShippingPaid: () => (
          <>
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
              Proceed to Review
            </button>
            <button
              onClick={() => actions.changePayment?.()}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Change Payment
            </button>
          </>
        ),
        Confirmation: () => (
          <button
            onClick={() => actions.restart?.()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start New Order
          </button>
        ),
      }, null)}
    </div>
  );
}
