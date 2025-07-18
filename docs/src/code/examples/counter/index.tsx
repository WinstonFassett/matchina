import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { CounterView } from "./CounterView";
import { createCounterMachine } from "./machine";

export function CounterDemo() {
  const machine = useMemo(createCounterMachine, []);
  useMachine(machine);
  return <CounterView machine={machine} />;
}
