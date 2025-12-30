import { MachineVisualizer } from "@components/MachineVisualizer";
import { StopwatchView } from "./StopwatchView";
import { useStopwatch } from "./useStopwatch";

// Main export for importing in MDX documentation
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

export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchView machine={stopwatch as any} />;
}
