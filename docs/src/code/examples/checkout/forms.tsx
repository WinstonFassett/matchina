import React, { useState } from "react";
import type { CheckoutMachine } from "./machine";
import type {
  CartData,
  PaymentData,
  ShippingData
} from "./types";

function getMissing(fields: Record<string, string>) {
  return Object.entries(fields)
    .filter(([_, v]) => !v.trim())
    .map(([k]) => k);
}

export function ShippingForm({
  data,
  machine,
}: {
  data: ShippingData;
  machine: CheckoutMachine;
}) {
  const {
    cart,
    shipping = { address: "", city: "", zipCode: "", error: null },
  } = data;
  const [address, setAddress] = useState(shipping.address || "");
  const [city, setCity] = useState(shipping.city || "");
  const [zipCode, setZipCode] = useState(shipping.zipCode || "");
  React.useEffect(() => {
    setAddress(shipping.address || "");
    setCity(shipping.city || "");
    setZipCode(shipping.zipCode || "");
  }, [shipping.address, shipping.city, shipping.zipCode]);

  const missingFields = getMissing({ address, city, zipCode });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
      {shipping.error && (
        <div className="mb-4 p-3 border border-red-400 text-red-700 rounded">
          {shipping.error}
        </div>
      )}
      {missingFields.length > 0 && (
        <div className="mb-4 p-3 border border-yellow-400 text-yellow-900 rounded bg-yellow-50">
          <span className="font-semibold">Missing:</span>{" "}
          {missingFields.join(", ")}
        </div>
      )}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-current/20 ${missingFields.includes("address") ? "border-yellow-400" : ""}`}
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
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-current/20 ${missingFields.includes("city") ? "border-yellow-400" : ""}`}
              placeholder="New York"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-current/20 ${missingFields.includes("zipCode") ? "border-yellow-400" : ""}`}
              placeholder="10001"
            />
          </div>
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={() => machine.backToCart(cart)}
          className="flex-1 px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
        >
          Back to Cart
        </button>
        <button
          onClick={() => {
            if (missingFields.length > 0) return;
            machine.proceedToPayment({
              cart,
              shipping: { address, city, zipCode },
            });
          }}
          className="flex-1 px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
          disabled={missingFields.length > 0}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}

export function PaymentForm({
  data,
  machine,
  handleAsyncProcessing,
}: {
  data: PaymentData;
  machine: CheckoutMachine;
  handleAsyncProcessing: (data: PaymentData) => void;
}) {
  const { cart, shipping, payment } = data;
  const [cardNumber, setCardNumber] = useState(payment.cardNumber || "");
  const [expiryDate, setExpiryDate] = useState(payment.expiryDate || "");
  const [cvv, setCvv] = useState(payment.cvv || "");
  React.useEffect(() => {
    setCardNumber(payment.cardNumber || "");
    setExpiryDate(payment.expiryDate || "");
    setCvv(payment.cvv || "");
  }, [payment.cardNumber, payment.expiryDate, payment.cvv]);

  const missingFields = getMissing({ cardNumber, expiryDate, cvv });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Payment Information</h2>
      {payment.error && (
        <div className="mb-4 p-3 border border-red-400 text-red-700 rounded">
          {payment.error}
        </div>
      )}
      {missingFields.length > 0 && (
        <div className="mb-4 p-3 border border-yellow-400 text-yellow-900 rounded bg-yellow-50">
          <span className="font-semibold">Missing:</span>{" "}
          {missingFields.join(", ")}
        </div>
      )}
      <div className="mb-6 p-4 rounded border border-current/10">
        <h3 className="font-semibold mb-2">Shipping Address</h3>
        <p>{shipping.address}</p>
        <p>
          {shipping.city}, {shipping.zipCode}
        </p>
      </div>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Card Number</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-current/20 ${missingFields.includes("cardNumber") ? "border-yellow-400" : ""}`}
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
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-current/20 ${missingFields.includes("expiryDate") ? "border-yellow-400" : ""}`}
              placeholder="MM/YY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CVV</label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-current/20 ${missingFields.includes("cvv") ? "border-yellow-400" : ""}`}
              placeholder="123"
            />
          </div>
        </div>
      </div>
      <div className="border-t pt-4 mb-6 border-current/10">
        <div className="flex justify-between text-xl font-bold">
          <span>Total: ${cart.total?.toFixed(2) ?? "0.00"}</span>
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={() =>
            machine.backToShipping({
              cart,
              shipping,
            })
          }
          className="flex-1 px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
        >
          Back to Shipping
        </button>
        <button
          onClick={() => {
            if (missingFields.length > 0) return;
            handleAsyncProcessing({
              cart,
              shipping,
              payment: { cardNumber, expiryDate, cvv },
            });
          }}
          className="flex-1 px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
          disabled={missingFields.length > 0}
        >
          Place Order
        </button>
      </div>
    </div>
  );
}

export function CartForm({
  data,
  machine,
}: {
  data: CartData;
  machine: CheckoutMachine;
}) {
  const [items, setItems] = useState(data.items);

  const handleQuantityChange = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
      )
    );
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center p-4 border rounded border-current/10"
          >
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="opacity-70">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="mr-2">Qty:</label>
              <input
                type="number"
                min={0}
                value={item.quantity}
                onChange={(e) =>
                  handleQuantityChange(item.id, Number(e.target.value))
                }
                className="w-16 px-2 py-1 border border-current/20 rounded text-center"
              />
              <span className="font-semibold">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-4 mb-6 border-current/10">
        <div className="flex justify-between text-xl font-bold">
          <span>Total: ${total.toFixed(2)}</span>
        </div>
      </div>
      {total <= 0 ? (
        <div className="text-center text-yellow-700 mb-4">
          Your cart is empty. Add items to proceed.
        </div>
      ) : (
        <button
          onClick={() => machine.proceedToShipping({ cart: { items, total } })}
          className="w-full px-4 py-2 rounded border border-current/20 text-current hover:bg-current/10"
          disabled={total <= 0}
        >
          Proceed to Shipping
        </button>
      )}
    </div>
  );
}
