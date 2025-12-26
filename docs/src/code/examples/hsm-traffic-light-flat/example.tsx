import { useMemo } from "react";
import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { createTrafficLightMachine } from "./machine";
import { TrafficLightView } from "./TrafficLightView";

export default function TrafficLightFlatExample() {
  const machine = useMemo(() => createTrafficLightMachine(), []);

  return (
    <MachineExampleWithChart
      machine={machine}
      AppView={TrafficLightView}
      title="Flattened Traffic Light"
      inspectorType="mermaid"
    />
  );
}
