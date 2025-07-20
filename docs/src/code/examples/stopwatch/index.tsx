import { createStopwatchMachine } from "./machine";
import { StopwatchView } from "./StopwatchView";

// Named export for backward compatibility
export function Stopwatch() {
  const stopwatch = createStopwatchMachine();
  return <StopwatchView machine={stopwatch} />;
}
