import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useState } from "react";
import { AsyncCalculatorView } from "./AsyncCalculatorView";
import { createAsyncCalculatorMachine } from "./machine";

export default function AsyncCalculatorExample() {
  const [calculator] = useState(() => createAsyncCalculatorMachine());
  return (
    <MachineExampleWithChart
      machine={calculator}
      AppView={AsyncCalculatorView}
      showRawState={true}
      inspectorType="mermaid"
      interactive={false}
    />
  );
}
