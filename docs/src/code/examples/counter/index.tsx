import { useMemo } from "react";
import { CounterView } from "./CounterView";
import { createCounterMachine } from "./machine";

export function CounterDemo() {
  const machine = useMemo(createCounterMachine, []);
  return <CounterView machine={machine} />;
}
