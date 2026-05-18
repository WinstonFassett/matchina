import React, { useContext } from "react";
import { useMachine } from "matchina/react";
import { eventApi } from "matchina";
import type { FactoryMachine } from "matchina";
import { createCheckoutMachine, type PaymentMachine } from "./machine";
import { CartItems, ShippingForm, CardForm, StepIndicator, Confirmation, STATE_TO_STEP } from "./ui";

type CheckoutMachine = FactoryMachine<ReturnType<typeof createCheckoutMachine>>;
type CheckoutActions = ReturnType<typeof eventApi<CheckoutMachine>>;

const CheckoutContext = React.createContext<{
  machine: CheckoutMachine;
  paymentMachine?: PaymentMachine;
  actions: CheckoutActions;
} | null>(null);

function useCheckoutContext() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckoutContext must be used within CheckoutContext.Provider");
  return ctx;
}

interface CheckoutViewNestedProps {
  machine: FactoryMachine<ReturnType<typeof createCheckoutMachine>>;
}

export function CheckoutViewNested({ machine }: CheckoutViewNestedProps) {
  useMachine(machine);
  const state = machine.getState() as { key: string; data?: any };
  const parent = state.key;

  let paymentMachine: PaymentMachine | undefined;
  if (state.data?.machine) paymentMachine = state.data.machine;

  const actions = eventApi(machine);
  const currentStep = STATE_TO_STEP[parent] ?? "Cart";

  return (
    <CheckoutContext.Provider value={{ machine, paymentMachine, actions }}>
      <div className="max-w-xs mx-auto bg-card rounded-2xl border border-border p-5">
        <StepIndicator currentStep={currentStep} />
        <div className="space-y-5">
          <MainContent parentState={parent} />
          {parent === "Payment" && paymentMachine && (
            <PaymentSection paymentMachine={paymentMachine} />
          )}
          <CheckoutControls parentState={parent} />
        </div>
      </div>
    </CheckoutContext.Provider>
  );
}

function MainContent({ parentState }: { parentState: string }) {
  switch (parentState) {
    case "Cart":
      return <CartItems />;
    case "Shipping":
      return <ShippingForm />;
    case "Review":
    case "ShippingPaid":
      return (
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Order Summary</p>
          <CartItems readOnly />
        </div>
      );
    case "Confirmation":
      return <Confirmation />;
    default:
      return null;
  }
}

function PaymentSection({ paymentMachine }: { paymentMachine: PaymentMachine }) {
  useMachine(paymentMachine);
  const paymentActions = eventApi(paymentMachine);
  const pState = paymentMachine.getState();

  return (
    <div className="space-y-3">
      {pState.match({
        MethodEntry: () => (
          <div className="space-y-3">
            <CardForm />
            <button onClick={() => paymentActions.authorize()} className="btn btn-primary w-full">
              Authorize Payment
            </button>
          </div>
        ),
        Authorizing: () => (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3.5 h-3.5 border-2 border-border border-t-primary rounded-full animate-spin" />
              Authorizing payment
            </div>
            <div className="border border-border rounded-xl p-3 space-y-2">
              <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground">Simulate outcome</p>
              <div className="flex gap-2">
                <button onClick={() => paymentActions.authSucceeded()} className="btn btn-outline btn-sm flex-1">Approve</button>
                <button onClick={() => paymentActions.authRequired()} className="btn btn-outline btn-sm flex-1">Challenge</button>
                <button onClick={() => paymentActions.authFailed()} className="btn btn-destructive btn-sm flex-1">Fail</button>
              </div>
            </div>
          </div>
        ),
        AuthChallenge: () => (
          <div className="space-y-3">
            <div className="bg-muted rounded-xl p-3">
              <p className="text-sm font-medium mb-0.5">Authentication required</p>
              <p className="text-xs text-muted-foreground">Your bank is requesting additional verification.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => paymentActions.authSucceeded()} className="btn btn-primary btn-sm flex-1">Approve</button>
              <button onClick={() => paymentActions.authFailed()} className="btn btn-destructive btn-sm flex-1">Deny</button>
            </div>
          </div>
        ),
        AuthorizationError: () => (
          <div className="space-y-3">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              <p className="text-sm text-destructive font-medium">Authorization failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your payment could not be authorized.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => paymentActions.retry()} className="btn btn-outline btn-sm flex-1">Try Again</button>
              <button onClick={() => paymentActions.exit()} className="btn btn-ghost btn-sm flex-1">Cancel</button>
            </div>
          </div>
        ),
        Authorized: () => (
          <div className="flex items-center gap-2 text-[oklch(0.55_0.16_142)] text-sm font-medium bg-[oklch(0.55_0.16_142)]/10 rounded-xl px-3 py-2.5">
            <span>✓</span>
            <span>Payment authorized</span>
          </div>
        ),
      })}
    </div>
  );
}

function CheckoutControls({ parentState }: { parentState: string }) {
  const { actions } = useCheckoutContext();

  switch (parentState) {
    case "Cart":
      return (
        <button onClick={() => actions.proceed()} className="btn btn-primary w-full">
          Continue to Shipping
        </button>
      );
    case "Shipping":
      return (
        <div className="flex gap-2">
          <button onClick={() => actions.back()} className="btn btn-outline flex-1">Back</button>
          <button onClick={() => actions.proceed()} className="btn btn-primary flex-1">Continue to Payment</button>
        </div>
      );
    case "Payment":
      return (
        <button onClick={() => actions.back()} className="btn btn-outline w-full">Back to Shipping</button>
      );
    case "ShippingPaid":
      return (
        <div className="space-y-2">
          <button onClick={() => actions.proceed()} className="btn btn-primary w-full">Continue to Review</button>
          <div className="flex gap-2">
            <button onClick={() => actions.back()} className="btn btn-outline btn-sm flex-1">Back to Cart</button>
            <button onClick={() => actions.changePayment()} className="btn btn-outline btn-sm flex-1">Change Payment</button>
          </div>
        </div>
      );
    case "Review":
      return (
        <div className="space-y-2">
          <button onClick={() => actions.submitOrder()} className="btn btn-primary w-full">Place Order</button>
          <div className="flex gap-2">
            <button onClick={() => actions.back()} className="btn btn-outline btn-sm flex-1">Back</button>
            <button onClick={() => actions.changePayment()} className="btn btn-outline btn-sm flex-1">Change Payment</button>
          </div>
        </div>
      );
    case "Confirmation":
      return (
        <button onClick={() => actions.restart()} className="btn btn-outline w-full">Start New Order</button>
      );
    default:
      return null;
  }
}
