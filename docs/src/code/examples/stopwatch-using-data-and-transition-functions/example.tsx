import { MachineVisualizer } from "@components/MachineVisualizer";
import { useMemo } from "react";
import { createStopwatchMachine } from "./machine";
import { StopwatchView } from "./StopwatchView";

export default function StopwatchExample() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  return (
    <MachineVisualizer
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
      defaultViz="forcegraph"
    />
  );
}
