import { CartForm, PaymentForm, ShippingForm } from "./forms";
import type { CheckoutMachine } from "./machine";

const steps = ["Cart", "Shipping", "Payment", "Done"] as const;
type Step = (typeof steps)[number];

const stateToStep: Record<string, Step> = {
  Cart: "Cart",
  Shipping: "Shipping",
  Payment: "Payment",
  Processing: "Payment",
  Success: "Done",
  Failed: "Payment",
};

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = steps.indexOf(currentStep);
  return (
    <div className="flex items-center gap-0 w-full mb-6">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors ${
                  done
                    ? "bg-primary/30 text-primary border border-primary/40"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[9px] font-mono uppercase tracking-widest whitespace-nowrap ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 mb-4 ${i < currentIndex ? "bg-primary/40" : "bg-border"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CheckoutView({ machine }: { machine: CheckoutMachine }) {
  const currentState = machine.getState();
  const currentStep = stateToStep[currentState.key] ?? "Cart";

  const handlePlaceOrder = async () => {
    if (Math.random() > 0.3) {
      machine.success();
    } else {
      machine.failure();
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-6">
      <StepIndicator currentStep={currentStep} />

      {currentState.match({
        Cart: () => <CartForm machine={machine} />,
        Shipping: () => <ShippingForm machine={machine} />,
        Payment: () => <PaymentForm machine={machine} handleAsyncProcessing={handlePlaceOrder} />,

        Processing: () => (
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin" />
            <div>
              <h2 className="text-base font-semibold mb-1">Processing order</h2>
              <p className="text-sm text-muted-foreground">Please wait while we confirm your payment.</p>
            </div>
          </div>
        ),

        Success: () => {
          const storeData = machine.store.getState();
          return (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[oklch(0.55_0.16_142)]/10 border border-[oklch(0.55_0.16_142)]/20 flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[oklch(0.55_0.16_142)] mb-1">Order confirmed</h2>
                <p className="text-xs font-mono text-muted-foreground">ID: {storeData.orderId}</p>
              </div>
              <div className="w-full bg-muted rounded-xl p-4 text-sm text-muted-foreground text-left">
                Your order has been placed. A confirmation will be sent to your email shortly.
              </div>
              <button type="button" onClick={() => machine.newOrder()} className="btn btn-outline btn-sm">
                Place Another Order
              </button>
            </div>
          );
        },

        Failed: () => {
          const storeData = machine.store.getState();
          return (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <span className="text-xl">✕</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-destructive mb-1">Order failed</h2>
                <p className="text-sm text-muted-foreground">{storeData.error}</p>
              </div>
              <div className="w-full bg-muted rounded-xl border border-destructive/20 p-4 text-sm text-muted-foreground text-left">
                There was a problem processing your payment. You have not been charged.
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => machine.retry()} className="btn btn-primary btn-sm">
                  Try Again
                </button>
                <button type="button" onClick={() => machine.backToCart()} className="btn btn-outline btn-sm">
                  Back to Cart
                </button>
              </div>
            </div>
          );
        },
      })}

      <div className="mt-5 text-center">
        <span className="badge badge-outline text-[10px]">{currentState.key}</span>
      </div>
    </div>
  );
}
