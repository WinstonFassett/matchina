import { useMachine } from "matchina/react";
import { type CheckoutMachine } from "./machine";
import React, { useState } from "react";

function ShippingForm({ data, machine }: any) {
  const [address, setAddress] = useState(data.address || "");
  const [city, setCity] = useState(data.city || "");
  const [zipCode, setZipCode] = useState(data.zipCode || "");
  React.useEffect(() => {
    setAddress(data.address || "");
    setCity(data.city || "");
    setZipCode(data.zipCode || "");
  }, [data.address, data.city, data.zipCode]);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
      {data.error && (
        <div className="mb-4 p-3 border border-red-400 text-red-700 rounded">
          {data.error}
        </div>
      )}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-current/20 rounded focus:outline-none focus:ring-2"
            placeholder="123 Main Street"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-current/20 rounded focus:outline-none focus:ring-2"
              placeholder="New York"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full px-3 py-2 border border-current/20 rounded focus:outline-none focus:ring-2"
              placeholder="10001"
            />
          </div>
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={() =>
            machine.backToCart({ items: data.items, total: data.total })
          }
          className="flex-1 px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
        >
          Back to Cart
        </button>
        <button
          onClick={() => {
            if (!address || !city || !zipCode) return;
            machine.proceedToPayment({
              items: data.items,
              total: data.total,
              shippingAddress: { address, city, zipCode },
            });
          }}
          className="flex-1 px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}

function PaymentForm({ data, machine, handleAsyncProcessing }: any) {
  const [cardNumber, setCardNumber] = useState(data.cardNumber || "");
  const [expiryDate, setExpiryDate] = useState(data.expiryDate || "");
  const [cvv, setCvv] = useState(data.cvv || "");
  React.useEffect(() => {
    setCardNumber(data.cardNumber || "");
    setExpiryDate(data.expiryDate || "");
    setCvv(data.cvv || "");
  }, [data.cardNumber, data.expiryDate, data.cvv]);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Payment Information</h2>
      {data.error && (
        <div className="mb-4 p-3 border border-red-400 text-red-700 rounded">
          {data.error}
        </div>
      )}
      <div className="mb-6 p-4 rounded border border-current/10">
        <h3 className="font-semibold mb-2">Shipping Address</h3>
        <p>{data.shippingAddress.address}</p>
        <p>
          {data.shippingAddress.city}, {data.shippingAddress.zipCode}
        </p>
      </div>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Card Number</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="w-full px-3 py-2 border border-current/20 rounded focus:outline-none focus:ring-2"
            placeholder="1234 5678 9012 3456"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Expiry Date
            </label>
            <input
              type="text"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-current/20 rounded focus:outline-none focus:ring-2"
              placeholder="MM/YY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CVV</label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              className="w-full px-3 py-2 border border-current/20 rounded focus:outline-none focus:ring-2"
              placeholder="123"
            />
          </div>
        </div>
      </div>
      <div className="border-t pt-4 mb-6 border-current/10">
        <div className="flex justify-between text-xl font-bold">
          <span>Total: ${data.total.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={() =>
            machine.backToShipping({
              items: data.items,
              total: data.total,
              address: data.shippingAddress.address,
              city: data.shippingAddress.city,
              zipCode: data.shippingAddress.zipCode,
            })
          }
          className="flex-1 px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
        >
          Back to Shipping
        </button>
        <button
          onClick={() => {
            if (!cardNumber || !expiryDate || !cvv) return;
            handleAsyncProcessing({
              items: data.items,
              total: data.total,
              shippingAddress: data.shippingAddress,
              cardNumber,
              expiryDate,
              cvv,
            });
          }}
          className="flex-1 px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}

export const CheckoutView = ({ machine }: { machine: CheckoutMachine }) => {
  useMachine(machine);
  const currentState = machine.getState();

  // Simulate async processing for payment
  const handleAsyncProcessing = async (data: any) => {
    machine.placeOrder({
      items: data.items,
      total: data.total,
      shippingAddress: data.shippingAddress,
    });
    setTimeout(() => {
      if (Math.random() > 0.3) {
        const orderId =
          "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        machine.success({ orderId, items: data.items, total: data.total });
      } else {
        machine.failure({
          error: "Payment failed. Please try again.",
          items: data.items,
          total: data.total,
        });
      }
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto rounded-lg border border-current/20 p-6">
      {currentState.match({
        Cart: (data) => {
          return (
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
                      <p className="opacity-70">
                        ${item.price.toFixed(2)} each
                      </p>
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
                onClick={() =>
                  machine.proceedToShipping({
                    items: data.items,
                    total: data.total,
                  })
                }
                className="w-full px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
              >
                Proceed to Shipping
              </button>
            </div>
          );
        },
        Shipping: (data) => <ShippingForm data={data} machine={machine} />,
        Payment: (data) => (
          <PaymentForm
            data={data}
            machine={machine}
            handleAsyncProcessing={handleAsyncProcessing}
          />
        ),
        Processing: () => (
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
                onClick={() =>
                  machine.retry({
                    items: data.items,
                    total: data.total,
                    shippingAddress: data.shippingAddress,
                    // The user will re-enter card info, so don't pass card fields
                  })
                }
                className="px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
              >
                Try Again
              </button>
              <button
                onClick={() =>
                  machine.backToCart({ items: data.items, total: data.total })
                }
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
