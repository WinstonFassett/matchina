import { createStopwatchMachine } from "./machine";
import { StopwatchView } from "./StopwatchView";

export default function StopwatchExample() {
  const machine = createStopwatchMachine();
  return <StopwatchView machine={machine} />;
}
