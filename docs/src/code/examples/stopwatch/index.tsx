import { createStopwatchMachine } from "./machine";
import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { StopwatchView } from "./StopwatchView";

// Main export for importing in MDX documentation
export default function StopwatchExample() {
  const stopwatch = createStopwatchMachine();
  return <MachineExampleWithChart machine={stopwatch} AppView={StopwatchView} showRawState={true} />;
}

// Named export for backward compatibility
export function Stopwatch() {
  const stopwatch = createStopwatchMachine();
  return <StopwatchView machine={stopwatch} />;
}
