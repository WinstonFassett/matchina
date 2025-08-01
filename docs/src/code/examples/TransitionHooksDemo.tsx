import { StopwatchView } from "./stopwatch-using-react-state-using-transitionhooks/StopwatchView";
import { useStopwatch } from "./stopwatch-using-react-state-using-transitionhooks/useStopwatch";

export function TransitionHooksDemo() {
  const stopwatch = useStopwatch();
  return <StopwatchView machine={stopwatch as any} />;
}
