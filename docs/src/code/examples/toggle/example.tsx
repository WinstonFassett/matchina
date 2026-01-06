import { MachineVisualizer } from "@components/MachineVisualizer";
import { useMemo } from "react";
import { ToggleView } from "./ToggleView";
import { createToggleMachine } from "./machine";

// Main export for importing in MDX documentation
export default function ToggleExample() {
  const machine = useMemo(createToggleMachine, []);
  return (
    <MachineVisualizer
      machine={machine as any}
      AppView={ToggleView}
      showRawState={true}
      defaultViz="reactflow-v2"
      layout="split"
      interactive={true}
      exampleName="toggle"
    />
  );
}
