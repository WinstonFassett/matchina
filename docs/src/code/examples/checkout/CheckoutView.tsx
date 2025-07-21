import { useMachine } from "matchina/react";
import { type CheckoutMachine } from "./machine";

export const CheckoutView = ({ machine }: { machine: CheckoutMachine }) => {
  useMachine(machine);
  const currentState = machine.getState();

  const handleAsyncProcessing = async () => {
    machine.api.placeOrder();

    // Simulate payment processing
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate random success/failure
      if (Math.random() > 0.3) {
        const orderId =
          "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        machine.api.success(orderId);
      } else {
        machine.api.failure("Payment failed. Please try again.");
      }
    } catch (error) {
      machine.api.failure("An error occurred during processing.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      {currentState.match({
        Cart: (data) => (
          <div>
            <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
            <div className="space-y-4 mb-6">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 border rounded"
                >
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-gray-600">
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
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total: ${data.total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => machine.api.proceedToShipping()}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Proceed to Shipping
            </button>
          </div>
        ),

        Shipping: (data) => (
          <div>
            <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
            {data.error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {data.error}
              </div>
            )}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => machine.api.updateAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => machine.api.updateCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={data.zipCode}
                    onChange={(e) => machine.api.updateZipCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => machine.api.backToCart()}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Back to Cart
              </button>
              <button
                onClick={() => {
                  if (!data.address || !data.city || !data.zipCode) {
                    // This would be handled by the machine in a real implementation
                    return;
                  }
                  machine.api.proceedToPayment();
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        ),

        Payment: (data) => (
          <div>
            <h2 className="text-2xl font-bold mb-6">Payment Information</h2>
            {data.error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {data.error}
              </div>
            )}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p>{data.shippingAddress.address}</p>
              <p>
                {data.shippingAddress.city}, {data.shippingAddress.zipCode}
              </p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={data.cardNumber}
                  onChange={(e) => machine.api.updateCardNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={data.expiryDate}
                    onChange={(e) =>
                      machine.api.updateExpiryDate(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={data.cvv}
                    onChange={(e) => machine.api.updateCvv(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total: ${data.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => machine.api.backToShipping()}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Back to Shipping
              </button>
              <button
                onClick={handleAsyncProcessing}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Place Order
              </button>
            </div>
          </div>
        ),

        Processing: () => (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Processing Order...</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Please wait while we process your payment...
            </p>
          </div>
        ),

        Success: (data) => (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
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
              <p className="text-gray-600 mb-4">Order ID: {data.orderId}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
              <p className="text-green-800">
                Your order has been placed successfully. You will receive a
                confirmation email shortly.
              </p>
            </div>
            <button
              onClick={() => machine.api.newOrder()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Place Another Order
            </button>
          </div>
        ),

        Failed: (data) => (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
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
              <p className="text-gray-600 mb-4">{data.error}</p>
            </div>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => machine.api.retry()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>
              <button
                onClick={() => machine.api.backToCart()}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
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
