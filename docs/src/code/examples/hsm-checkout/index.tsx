import { useMemo } from "react";
import { CheckoutView } from "./CheckoutView";
import { createCheckoutMachine } from "./machine";

export function CheckoutDemo() {
  const machine = useMemo(createCheckoutMachine, []);
  return <CheckoutView machine={machine} />;
}
