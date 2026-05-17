import { useState } from "react";
import React from "react";

export const inputCls =
  "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
      {children}
    </label>
  );
}

const DEFAULT_ITEMS = [
  { id: "1", name: "Wireless Headphones", price: 99.99, quantity: 1 },
  { id: "2", name: "Bluetooth Speaker", price: 49.99, quantity: 2 },
];

export function CartItems({ readOnly }: { readOnly?: boolean }) {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleQty = (id: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, qty) } : i)));

  return (
    <div>
      <div className="space-y-2 mb-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center bg-muted rounded-xl px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
              {readOnly ? (
                <span className="text-xs text-muted-foreground">×{item.quantity}</span>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={(e) => handleQty(item.id, Number(e.target.value))}
                  className="w-12 bg-background border border-border rounded-lg px-1.5 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
              <span className="text-sm font-semibold tabular-nums w-14 text-right">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Total</span>
        <span className="text-base font-bold tabular-nums">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function ShippingForm() {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Address</FieldLabel>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} placeholder="123 Main Street" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>City</FieldLabel>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="New York" />
        </div>
        <div>
          <FieldLabel>ZIP</FieldLabel>
          <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className={inputCls} placeholder="10001" />
        </div>
      </div>
    </div>
  );
}

export function CardForm() {
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Card Number</FieldLabel>
        <input type="text" value={card} onChange={(e) => setCard(e.target.value)} className={inputCls} placeholder="1234 5678 9012 3456" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Expiry</FieldLabel>
          <input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={inputCls} placeholder="MM/YY" />
        </div>
        <div>
          <FieldLabel>CVV</FieldLabel>
          <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value)} className={inputCls} placeholder="123" />
        </div>
      </div>
    </div>
  );
}

const STEPS = ["Cart", "Shipping", "Payment", "Review", "Done"] as const;
export type Step = (typeof STEPS)[number];

export const STATE_TO_STEP: Record<string, Step> = {
  Cart: "Cart",
  Shipping: "Shipping",
  Payment: "Payment",
  ShippingPaid: "Review",
  Review: "Review",
  Confirmation: "Done",
};

export function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEPS.indexOf(currentStep);
  return (
    <div className="flex items-center w-full mb-5">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors ${
                done
                  ? "bg-primary/30 text-primary border border-primary/40"
                  : active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border border-border"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[8px] font-mono uppercase tracking-widest whitespace-nowrap ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1.5 mb-4 ${i < currentIndex ? "bg-primary/40" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function Confirmation() {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="w-10 h-10 rounded-full bg-[oklch(0.55_0.16_142)]/10 border border-[oklch(0.55_0.16_142)]/20 flex items-center justify-center text-lg">
        ✓
      </div>
      <div>
        <p className="text-sm font-semibold text-[oklch(0.55_0.16_142)]">Order confirmed</p>
        <p className="text-xs text-muted-foreground mt-0.5">You'll receive a confirmation shortly.</p>
      </div>
    </div>
  );
}
