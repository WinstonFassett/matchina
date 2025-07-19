import { StopwatchView } from "./StopwatchView";
import { useStopwatch } from "./useStopwatch";

// Named export for backward compatibility
export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchView machine={stopwatch} />;
}
