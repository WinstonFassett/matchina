import { useState } from "react";
import type { CheckoutMachine } from "./machine";
import type { PaymentData } from "./types";

const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
      {children}
    </label>
  );
}

function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="mb-4 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive">
      {error}
    </div>
  );
}

export function CartForm({ machine }: { machine: CheckoutMachine }) {
  const [items, setItems] = useState(machine.store.getState().cart.items);

  const handleQuantityChange = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item)),
    );
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      <h2 className="text-base font-semibold mb-4">Shopping Cart</h2>
      <div className="space-y-2 mb-5">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center bg-muted rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor={item.id} className="text-xs text-muted-foreground">
                Qty
              </label>
              <input
                id={item.id}
                type="number"
                min={0}
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                className="w-14 bg-background border border-border rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm font-semibold tabular-nums w-14 text-right">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted rounded-xl p-4 mb-5 flex justify-between items-center">
        <span className="text-sm text-muted-foreground font-mono uppercase tracking-widest text-[10px]">
          Total
        </span>
        <span className="text-xl font-bold tabular-nums">${total.toFixed(2)}</span>
      </div>

      <button
        type="button"
        onClick={() => machine.proceedToShipping()}
        className="btn btn-primary w-full"
      >
        Continue to Shipping
      </button>
    </div>
  );
}

export function ShippingForm({ machine }: { machine: CheckoutMachine }) {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");

  const error = machine.store.getState().error;

  return (
    <div>
      <h2 className="text-base font-semibold mb-4">Shipping Information</h2>
      <ErrorBanner error={error} />

      <div className="space-y-4 mb-6">
        <div>
          <FieldLabel>Address</FieldLabel>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputCls}
            placeholder="123 Main Street"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>City</FieldLabel>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputCls}
              placeholder="New York"
            />
          </div>
          <div>
            <FieldLabel>ZIP Code</FieldLabel>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className={inputCls}
              placeholder="10001"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => machine.backToCart()} className="btn btn-outline flex-1">
          Back
        </button>
        <button type="button" onClick={() => machine.proceedToPayment()} className="btn btn-primary flex-1">
          Continue to Payment
        </button>
      </div>
    </div>
  );
}

export function PaymentForm({
  machine,
  handleAsyncProcessing,
}: {
  machine: CheckoutMachine;
  handleAsyncProcessing: (data: PaymentData) => void;
}) {
  const cart = machine.store.getState().cart;
  const shipping = machine.store.getState().shipping;
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const error = machine.store.getState().error;

  return (
    <div>
      <h2 className="text-base font-semibold mb-4">Payment</h2>
      <ErrorBanner error={error} />

      <div className="bg-muted rounded-xl px-4 py-3 mb-5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
          Shipping to
        </p>
        <p className="text-sm">{shipping.address}</p>
        <p className="text-sm text-muted-foreground">
          {shipping.city}, {shipping.zipCode}
        </p>
      </div>

      <div className="space-y-4 mb-5">
        <div>
          <FieldLabel>Card Number</FieldLabel>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className={inputCls}
            placeholder="1234 5678 9012 3456"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Expiry</FieldLabel>
            <input
              type="text"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={inputCls}
              placeholder="MM/YY"
            />
          </div>
          <div>
            <FieldLabel>CVV</FieldLabel>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              className={inputCls}
              placeholder="123"
            />
          </div>
        </div>
      </div>

      <div className="bg-muted rounded-xl p-4 mb-5 flex justify-between items-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total</span>
        <span className="text-xl font-bold tabular-nums">${cart.total?.toFixed(2) ?? "0.00"}</span>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => machine.backToShipping()} className="btn btn-outline flex-1">
          Back
        </button>
        <button
          type="button"
          onClick={() => handleAsyncProcessing({ cart, shipping, payment: { cardNumber, expiryDate, cvv } })}
          className="btn btn-primary flex-1"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
