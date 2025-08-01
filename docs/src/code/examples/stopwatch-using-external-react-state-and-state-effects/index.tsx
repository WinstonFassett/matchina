import { StopwatchView } from "./StopwatchView";
import { useStopwatch } from "./useStopwatch";

export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchView machine={stopwatch as any} />;
}
