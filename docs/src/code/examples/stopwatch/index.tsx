import { createStopwatchMachine } from "./machine";
import { StopwatchView } from "./StopwatchView";

export function Stopwatch() {
  const machine = createStopwatchMachine();
  return <StopwatchView machine={machine} />;
}

// Default export for the examples
export default Stopwatch;
