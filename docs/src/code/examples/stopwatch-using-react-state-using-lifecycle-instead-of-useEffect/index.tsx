
import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { StopwatchApp } from "../components/StopwatchApp";
import { useStopwatch } from "./useStopwatch";

// Main export for importing in MDX documentation
export default function StopwatchExample() {
  const stopwatch = useStopwatch();
  return <MachineExampleWithChart machine={stopwatch} AppView={StopwatchApp} showRawState={true} />;
}

// Named export for backward compatibility
export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchApp machine={stopwatch} />;
}
