import React, { useContext } from "react";
import { useMachine } from "matchina/react";
import { eventApi } from "matchina";
import { parseFlatStateKey } from "matchina/hsm";
import { createFlatCheckoutMachine } from "./machine-flat";

// Type the machine and its actions
type CheckoutMachine = ReturnType<typeof createFlatCheckoutMachine>;
type CheckoutActions = ReturnType<typeof eventApi<CheckoutMachine>>;

// Context to share the payment machine and event APIs
const CheckoutContext = React.createContext<{
  machine: CheckoutMachine;
  actions: CheckoutActions;
} | null>(null);

function useCheckoutContext() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error(
      "useCheckoutContext must be used within CheckoutContext.Provider"
    );
  }
  return context;
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
      <div className="max-w-xs mx-auto bg-card rounded-2xl border border-border p-5">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
          Checkout · Flattened
        </h3>

        <div className="space-y-6">
          <CheckoutSteps currentStep={parent} />
          <PaymentSection parsed={parsed} />
          <CheckoutControls />

          <div className="text-center">
            <span className="badge badge-outline text-[10px] font-mono">
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

  const currentIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <div className="flex items-center justify-between gap-1">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                index <= currentIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>
            <span className={`text-[9px] whitespace-nowrap font-medium ${index <= currentIndex ? "text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-px mb-4 ${index < currentIndex ? "bg-primary" : "bg-border"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function PaymentSection({
  parsed,
}: {
  parsed: { parent: string; child: string | null };
}) {
  const { machine } = useCheckoutContext();
  const state = machine.getState();

  // Handle flattened payment states
  const stateKey = state.key;
  if (stateKey.startsWith("Payment.")) {
    return <PaymentFlow parsed={parsed} />;
  }

  return null;
}

function PaymentFlow({
  parsed,
}: {
  parsed: { parent: string; child: string | null };
}) {
  const { machine } = useCheckoutContext();

  // In flattened mode, the payment state is embedded in the main state's data
  const mainState = machine.getState();
  let paymentState;

  if (
    mainState.data &&
    typeof mainState.data === "object" &&
    "getTag" in mainState.data
  ) {
    // Extract the actual payment state from the MatchboxImpl
    paymentState = mainState.data;
  } else {
    // Fallback: use the main state directly
    paymentState = mainState;
  }

  if (!paymentState) return null;

  // Use the main machine's actions for flattened mode
  const paymentActions = eventApi(machine) as CheckoutActions;

  return (
    <div className="rounded-xl border border-border bg-muted p-4">
      <h4 className="text-sm font-medium mb-3">Payment Method</h4>

      <div className="space-y-3">
        {paymentState.match(
          {
            "Payment.MethodEntry": () => (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Select payment method</p>
                <button
                  onClick={() => paymentActions.authorize?.()}
                  className="btn btn-primary"
                >
                  Authorize Payment
                </button>
              </div>
            ),
            "Payment.Authorizing": () => (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-border border-t-primary rounded-full" />
                <span className="text-sm text-muted-foreground">Authorizing…</span>
              </div>
            ),
            "Payment.AuthChallenge": () => (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Additional authentication required</p>
                <div className="space-x-2">
                  <button
                    onClick={() => paymentActions.authSucceeded?.()}
                    className="btn btn-secondary btn-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => paymentActions.authFailed?.()}
                    className="btn btn-destructive btn-sm"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ),
            "Payment.AuthorizationError": () => (
              <div>
                <p className="text-xs text-destructive mb-2">Authorization failed</p>
                <button
                  onClick={() => paymentActions.retry?.()}
                  className="btn btn-outline btn-sm"
                >
                  Retry
                </button>
              </div>
            ),
            "Payment.Authorized": () => (
              <div className="flex items-center space-x-2 text-[oklch(0.55_0.16_142)]">
                <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">Payment Authorized</span>
              </div>
            ),
          },
          null
        )}
      </div>

      {/* Payment Simulation Controls - only show when authorizing */}
      {parsed.child === "Authorizing" && (
        <PaymentSimulationControls paymentActions={paymentActions} />
      )}
    </div>
  );
}

function PaymentSimulationControls({
  paymentActions,
}: {
  paymentActions: CheckoutActions;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Simulation</h5>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => paymentActions.authSucceeded?.()}
          className="btn btn-secondary btn-sm"
        >
          Approve (Success)
        </button>
        <button
          onClick={() => paymentActions.authFailed?.()}
          className="btn btn-destructive btn-sm"
        >
          Deny (Challenge)
        </button>
        <button
          onClick={() => paymentActions.retry?.()}
          className="btn btn-outline btn-sm"
        >
          Retry Failed
        </button>
        <button
          onClick={() => {
            // Simulate a network error by setting an invalid state
            console.log("Simulating payment network error...");
            // This would typically trigger an AuthorizationError state in a real implementation
            paymentActions.retry?.();
          }}
          className="btn btn-outline btn-sm"
        >
          Network Error
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">Simulate approve, deny, retry, or network error</p>
    </div>
  );
}

function CheckoutControls() {
  const { actions } = useCheckoutContext();
  const { machine } = useCheckoutContext();
  const state = machine.getState();

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {state.match(
        {
          Cart: () => (
            <button
              onClick={() => actions.proceed?.()}
              className="btn btn-primary"
            >
              Proceed to Shipping
            </button>
          ),
          Shipping: () => (
            <>
              <button
                onClick={() => actions.back?.()}
                className="btn btn-ghost"
              >
                Back to Cart
              </button>
              <button
                onClick={() => actions.proceed?.()}
                className="btn btn-primary"
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
                className="btn btn-ghost"
              >
                Back to Shipping
              </button>
            </>
          ),
          "Payment.Authorizing": () => (
            <>
              <button
                onClick={() => actions.back?.()}
                className="btn btn-ghost"
              >
                Back to Shipping
              </button>
            </>
          ),
          "Payment.AuthChallenge": () => (
            <>
              <button
                onClick={() => actions.back?.()}
                className="btn btn-ghost"
              >
                Back to Shipping
              </button>
            </>
          ),
          "Payment.AuthorizationError": () => (
            <>
              <button
                onClick={() => actions.back?.()}
                className="btn btn-ghost"
              >
                Back to Shipping
              </button>
            </>
          ),
          "Payment.Authorized": () => (
            <>
              <button
                onClick={() => actions.back?.()}
                className="btn btn-ghost"
              >
                Back to Shipping
              </button>
            </>
          ),
          Review: () => (
            <>
              <button
                onClick={() => actions.back?.()}
                className="btn btn-ghost"
              >
                Back to Shipping
              </button>
              <button
                onClick={() => actions.changePayment?.()}
                className="btn btn-outline"
              >
                Change Payment
              </button>
              <button
                onClick={() => actions.submitOrder?.()}
                className="btn btn-secondary"
              >
                Submit Order
              </button>
            </>
          ),
          ShippingPaid: () => (
            <>
              <button
                onClick={() => actions.back?.()}
                className="btn btn-ghost"
              >
                Back to Cart
              </button>
              <button
                onClick={() => actions.proceed?.()}
                className="btn btn-primary"
              >
                Proceed to Review
              </button>
              <button
                onClick={() => actions.changePayment?.()}
                className="btn btn-outline"
              >
                Change Payment
              </button>
            </>
          ),
          Confirmation: () => (
            <button
              onClick={() => actions.restart?.()}
              className="btn btn-primary"
            >
              Start New Order
            </button>
          ),
        },
        null
      )}
    </div>
  );
}
