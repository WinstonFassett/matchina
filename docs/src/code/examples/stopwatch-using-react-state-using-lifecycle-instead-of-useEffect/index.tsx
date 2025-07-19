import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { StopwatchView } from "./StopwatchView";
import { useStopwatch } from "./useStopwatch";

// Main export for importing in MDX documentation
export default function StopwatchExample() {
  const stopwatch = useStopwatch();
  return (
    <MachineExampleWithChart
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
    />
  );
}

// Named export for backward compatibility
export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchView machine={stopwatch} />;
}
