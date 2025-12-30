import { MachineVisualizer } from "@components/MachineVisualizer";
import { StopwatchView } from "./StopwatchView";
import { useStopwatch } from "./useStopwatch";

export default function StopwatchExample() {
  const stopwatch = useStopwatch();
  return (
    <MachineVisualizer
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
      defaultViz="forcegraph"
    />
  );
}
