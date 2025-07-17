import { createApi } from "matchina";
import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { createCounterMachine } from "./machine";
import { CounterView } from "./CounterView";

// For standalone usage
export function CounterDemo() {
  const machine = useMemo(createCounterMachine, []);
  useMachine(machine);
  return <CounterView machine={machine} />;
}
