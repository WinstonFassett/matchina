import React, { useContext } from "react";
import { useMachine } from "matchina/react";
import { eventApi } from "matchina";
import { parseFlatStateKey } from "matchina/hsm";
import { createFlatCheckoutMachine } from "./machine-flat";
import { CartItems, ShippingForm, CardForm, StepIndicator, Confirmation, STATE_TO_STEP } from "./ui";

type CheckoutMachine = ReturnType<typeof createFlatCheckoutMachine>;
type CheckoutActions = ReturnType<typeof eventApi<CheckoutMachine>>;

const CheckoutContext = React.createContext<{
  machine: CheckoutMachine;
  actions: CheckoutActions;
} | null>(null);

function useCheckoutContext() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckoutContext must be used within CheckoutContext.Provider");
  return ctx;
}

interface CheckoutViewFlatProps {
  machine: CheckoutMachine;
}

export function CheckoutViewFlat({ machine }: CheckoutViewFlatProps) {
  useMachine(machine);
  const state = machine.getState() as { key: string; data?: any };
  const parsed = parseFlatStateKey(state.key);
  const parent = parsed.parent;
  const child = parsed.child;
  const actions = eventApi(machine);
  const currentStep = STATE_TO_STEP[parent] ?? "Cart";

  return (
    <CheckoutContext.Provider value={{ machine, actions }}>
      <div className="max-w-xs mx-auto bg-card rounded-2xl border border-border p-5">
        <StepIndicator currentStep={currentStep} />
        <div className="space-y-5">
          <MainContent parent={parent} child={child} />
          <CheckoutControls parent={parent} />
        </div>
      </div>
    </CheckoutContext.Provider>
  );
}

function MainContent({ parent, child }: { parent: string; child: string | null }) {
  if (parent === "Cart") return <CartItems />;
  if (parent === "Shipping") return <ShippingForm />;
  if (parent === "Payment" && child) return <PaymentContent child={child} />;
  if (parent === "Review" || parent === "ShippingPaid") {
    return (
      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Order Summary</p>
        <CartItems readOnly />
      </div>
    );
  }
  if (parent === "Confirmation") return <Confirmation />;
  return null;
}

function PaymentContent({ child }: { child: string }) {
  const { actions } = useCheckoutContext();

  switch (child) {
    case "MethodEntry":
      return (
        <div className="space-y-3">
          <CardForm />
          <button onClick={() => actions.authorize?.()} className="btn btn-primary w-full">
            Authorize Payment
          </button>
        </div>
      );
    case "Authorizing":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-3.5 h-3.5 border-2 border-border border-t-primary rounded-full animate-spin" />
            Authorizing payment
          </div>
          <div className="border border-border rounded-xl p-3 space-y-2">
            <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground">Simulate outcome</p>
            <div className="flex gap-2">
              <button onClick={() => actions.authSucceeded?.()} className="btn btn-outline btn-sm flex-1">Approve</button>
              <button onClick={() => actions.authRequired?.()} className="btn btn-outline btn-sm flex-1">Challenge</button>
              <button onClick={() => actions.authFailed?.()} className="btn btn-destructive btn-sm flex-1">Fail</button>
            </div>
          </div>
        </div>
      );
    case "AuthChallenge":
      return (
        <div className="space-y-3">
          <div className="bg-muted rounded-xl p-3">
            <p className="text-sm font-medium mb-0.5">Authentication required</p>
            <p className="text-xs text-muted-foreground">Your bank is requesting additional verification.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => actions.authSucceeded?.()} className="btn btn-primary btn-sm flex-1">Approve</button>
            <button onClick={() => actions.authFailed?.()} className="btn btn-destructive btn-sm flex-1">Deny</button>
          </div>
        </div>
      );
    case "AuthorizationError":
      return (
        <div className="space-y-3">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
            <p className="text-sm text-destructive font-medium">Authorization failed</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your payment could not be authorized.</p>
          </div>
          <button onClick={() => actions.retry?.()} className="btn btn-outline btn-sm">Try Again</button>
        </div>
      );
    case "Authorized":
      return (
        <div className="flex items-center gap-2 text-[oklch(0.55_0.16_142)] text-sm font-medium bg-[oklch(0.55_0.16_142)]/10 rounded-xl px-3 py-2.5">
          <span>✓</span>
          <span>Payment authorized</span>
        </div>
      );
    default:
      return null;
  }
}

function CheckoutControls({ parent }: { parent: string }) {
  const { actions } = useCheckoutContext();

  switch (parent) {
    case "Cart":
      return (
        <button onClick={() => actions.proceed?.()} className="btn btn-primary w-full">
          Continue to Shipping
        </button>
      );
    case "Shipping":
      return (
        <div className="flex gap-2">
          <button onClick={() => actions.back?.()} className="btn btn-outline flex-1">Back</button>
          <button onClick={() => actions.proceed?.()} className="btn btn-primary flex-1">Continue to Payment</button>
        </div>
      );
    case "Payment":
      return (
        <button onClick={() => actions.back?.()} className="btn btn-outline w-full">Back to Shipping</button>
      );
    case "ShippingPaid":
      return (
        <div className="space-y-2">
          <button onClick={() => actions.proceed?.()} className="btn btn-primary w-full">Continue to Review</button>
          <div className="flex gap-2">
            <button onClick={() => actions.back?.()} className="btn btn-outline btn-sm flex-1">Back to Cart</button>
            <button onClick={() => actions.changePayment?.()} className="btn btn-outline btn-sm flex-1">Change Payment</button>
          </div>
        </div>
      );
    case "Review":
      return (
        <div className="space-y-2">
          <button onClick={() => actions.submitOrder?.()} className="btn btn-primary w-full">Place Order</button>
          <div className="flex gap-2">
            <button onClick={() => actions.back?.()} className="btn btn-outline btn-sm flex-1">Back</button>
            <button onClick={() => actions.changePayment?.()} className="btn btn-outline btn-sm flex-1">Change Payment</button>
          </div>
        </div>
      );
    case "Confirmation":
      return (
        <button onClick={() => actions.restart?.()} className="btn btn-outline w-full">Start New Order</button>
      );
    default:
      return null;
  }
}
