import { MachineVisualizer } from "@components/MachineVisualizer";
import { useMemo } from "react";
import { TrafficLightView } from "./TrafficLightView";
import { createTrafficLightMachine } from "./machine";

// Main export for importing in MDX documentation
export default function TrafficLightExample() {
  const machine = useMemo(createTrafficLightMachine, []);
  return (
    <MachineVisualizer
      machine={machine as any}
      AppView={TrafficLightView}
      showRawState={true}
      defaultViz="reactflow"
    />
  );
}
