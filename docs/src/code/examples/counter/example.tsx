import { MachineVisualizer } from "@components/MachineVisualizer";
import { useMemo } from "react";
import { CounterView } from "./CounterView";
import { createCounterMachine } from "./machine";

// Main export for importing in MDX documentation

export default function CounterExample() {
  const machine = useMemo(createCounterMachine, []);
  return (
    <MachineVisualizer
      machine={machine as any}
      AppView={CounterView}
      showRawState={true}
      defaultViz="reactflow"
    />
  );
}
