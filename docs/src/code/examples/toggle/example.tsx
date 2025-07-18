import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { ToggleView } from "./ToggleView";
import { createToggleMachine } from "./machine";

// Main export for importing in MDX documentation
export default function ToggleExample() {
  const machine = useMemo(createToggleMachine, []);
  useMachine(machine);
  return <MachineExampleWithChart machine={machine as any} AppView={ToggleView} showRawState={true} />;
}
