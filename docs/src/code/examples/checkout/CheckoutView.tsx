import { useMachine } from "matchina/react";
import type { CheckoutMachine } from "./machine";
import React from "react";
import { ShippingForm, PaymentForm } from "./subforms";

export const CheckoutView = ({ machine }: { machine: CheckoutMachine }) => {
  useMachine(machine);
  const currentState = machine.getState();

  // Simulate async processing for payment
  const handleAsyncProcessing = async (data: any) => {
    machine.placeOrder(data);
    setTimeout(() => {
      if (Math.random() > 0.3) {
        const orderId =
          "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
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
        Cart: (data) => (
          <div>
            <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
            <div className="space-y-4 mb-6">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 border rounded border-current/10"
                >
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="opacity-70">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Qty: {item.quantity}</span>
                    <span className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mb-6 border-current/10">
              <div className="flex justify-between text-xl font-bold">
                <span>Total: ${data.total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => machine.proceedToShipping({ cart: data })}
              className="w-full px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
            >
              Proceed to Shipping
            </button>
          </div>
        ),
        Shipping: (data) => <ShippingForm data={data} machine={machine} />,
        Payment: (data) => (
          <PaymentForm
            data={data}
            machine={machine}
            handleAsyncProcessing={handleAsyncProcessing}
          />
        ),
        Processing: (data) => (
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
