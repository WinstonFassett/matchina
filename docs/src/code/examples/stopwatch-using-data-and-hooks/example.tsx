import { MachineVisualizer } from "@components/MachineVisualizer";
import { useMemo } from "react";
import { StopwatchView } from "./StopwatchView";
import { createStopwatchMachine } from "./machine";

export default function StopwatchExample() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  return (
    <MachineVisualizer
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
      defaultViz="reactflow"
    />
  );
}
