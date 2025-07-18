import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { ExtendedTrafficLightView } from "./TrafficLightView";
import { createExtendedTrafficLightMachine } from "./machine";

// Main export for importing in MDX documentation
export default function ExtendedTrafficLightExample() {
  const machine = useMemo(createExtendedTrafficLightMachine, []);
  useMachine(machine);
  return <MachineExampleWithChart machine={machine as any} AppView={ExtendedTrafficLightView} showRawState={true} />;
}
