import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMemo } from "react";
import { TrafficLightView } from "./TrafficLightView";
import { createTrafficLightMachine } from "./machine";

// Main export for importing in MDX documentation
export default function TrafficLightExample() {
  const machine = useMemo(createTrafficLightMachine, []);
  return <MachineExampleWithChart machine={machine as any} AppView={TrafficLightView} showRawState={true} />;
}
