import { MachineVisualizer } from "@components/MachineVisualizer";
import { StopwatchView } from "./StopwatchView";
import { useStopwatch } from "./useStopwatch";

export default function StopwatchExample() {
  const stopwatch = useStopwatch();
  return (
    <MachineVisualizer
      defaultViz="reactflow"
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
    />
  );
}
