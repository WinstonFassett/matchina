import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMachine } from "@lib/src/integrations/react";
import { useMemo } from "react";
import { CounterView } from "./CounterView";
import { createCounterMachine } from "./machine";

// Main export for importing in MDX documentation

export default function CounterExample() {
  const machine = useMemo(createCounterMachine, []);
  useMachine(machine);
  return <MachineExampleWithChart machine={machine as any} AppView={CounterView} showRawState={true} />;
}
