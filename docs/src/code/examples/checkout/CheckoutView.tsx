import { CartForm, PaymentForm, ShippingForm } from "./forms";
import type { CheckoutMachine } from "./machine";

export function CheckoutView({ machine }: { machine: CheckoutMachine }) {
  const currentState = machine.getState();

  const handlePlaceOrder = async () => {
    if (Math.random() > 0.3) {
      const orderId =
        "ORD-" + Math.random().toString(36).substring(2, 9).toUpperCase();
      machine.success();
    } else {
      machine.failure();
    }
  };

  return (
    <div className="max-w-2xl mx-auto rounded-lg border border-current/20 p-6">
      {currentState.match({
        Cart: () => <CartForm machine={machine} />,
        Shipping: () => <ShippingForm machine={machine} />,
        Payment: () => (
          <PaymentForm
            machine={machine}
            handleAsyncProcessing={handlePlaceOrder}
          />
        ),
        Processing: (_data) => (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Processing Order...</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
            <p className="opacity-70">
              Please wait while we process your payment...
            </p>
          </div>
        ),
        Success: () => {
          const storeData = machine.store.getState();
          return (
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-600 mb-2">
                  Order Successful!
                </h2>
                <p className="opacity-70 mb-4">Order ID: {storeData.orderId}</p>
              </div>
              <div className="border border-green-200 rounded p-4 mb-6">
                <p className="text-green-800">
                  Your order has been placed successfully. You will receive a
                  confirmation email shortly.
                </p>
              </div>
              <button type="button"
                onClick={() => machine.newOrder()}
                className="px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
              >
                Place Another Order
              </button>
            </div>
          );
        },
        Failed: () => {
          const storeData = machine.store.getState();
          return (
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-red-600 mb-2">
                  Order Failed
                </h2>
                <p className="opacity-70 mb-4">{storeData.error}</p>
              </div>
              <div className="border border-red-200 rounded p-4 mb-6">
                <p className="text-red-800">
                  There was an error processing your order. Please try again.
                </p>
              </div>
              <button type="button"
                onClick={() => machine.retry()}
                className="px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
              >
                Try Again
              </button>
              <button type="button"
                onClick={() => machine.backToCart()}
                className="px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
              >
                Back to Cart
              </button>
            </div>
          );
        },
      })}
    </div>
  );
}
