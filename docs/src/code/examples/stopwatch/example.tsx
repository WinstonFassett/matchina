import { MachineVisualizer } from "@components/MachineVisualizer";
import { createStopwatchMachine } from "./machine";
import { StopwatchView } from "./StopwatchView";

export default function StopwatchExample() {
  const stopwatch = createStopwatchMachine();
  return (
    <MachineVisualizer
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
      defaultViz="forcegraph"
    />
  );
}
