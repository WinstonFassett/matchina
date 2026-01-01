import { MachineVisualizer } from "@components/MachineVisualizer";
import { useState } from "react";
import { AsyncCalculatorView } from "./AsyncCalculatorView";
import { createAsyncCalculatorMachine } from "./machine";

export default function AsyncCalculatorExample() {
  const [calculator] = useState(() => createAsyncCalculatorMachine());
  return (
    <MachineVisualizer
      machine={calculator}
      AppView={AsyncCalculatorView}
      showRawState={true}
      defaultViz="mermaid-statechart"
      interactive={false}
    />
  );
}
