import { useMachine } from "matchina/react";
import { CartForm, PaymentForm, ShippingForm } from "./forms";
import type { CheckoutMachine } from "./machine";

export const CheckoutView = ({ machine }: { machine: CheckoutMachine }) => {
  useMachine(machine);
  const currentState = machine.getState();

  // Simulate async processing for payment
  const handleAsyncProcessing = async (data: any) => {
    machine.placeOrder(data);
    setTimeout(() => {
      if (Math.random() > 0.3) {
        const orderId =
          "ORD-" + Math.random().toString(36).substring(2, 9).toUpperCase();
        machine.success({ ...data, orderId });
      } else {
        machine.failure({
          ...data,
          error: "Payment failed. Please try again.",
        });
      }
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto rounded-lg border border-current/20 p-6">
      {currentState.match({
        Cart: (data) => <CartForm data={data} machine={machine} />,
        Shipping: (data) => <ShippingForm data={data} machine={machine} />,
        Payment: (data) => (
          <PaymentForm
            data={data}
            machine={machine}
            handleAsyncProcessing={handleAsyncProcessing}
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
        Success: (data) => (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-500">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Order Successful!
              </h2>
              <p className="opacity-70 mb-4">Order ID: {data.orderId}</p>
            </div>
            <div className="border border-green-200 rounded p-4 mb-6">
              <p className="text-green-800">
                Your order has been placed successfully. You will receive a
                confirmation email shortly.
              </p>
            </div>
            <button
              onClick={() => machine.newOrder()}
              className="px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
            >
              Place Another Order
            </button>
          </div>
        ),
        Failed: (data) => (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-500">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Order Failed
              </h2>
              <p className="opacity-70 mb-4">{data.error}</p>
            </div>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => machine.retry(data)}
                className="px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
              >
                Try Again
              </button>
              <button
                onClick={() => machine.backToCart(data.cart)}
                className="px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
              >
                Back to Cart
              </button>
            </div>
          </div>
        ),
      })}
    </div>
  );
};
