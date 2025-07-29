import { StopwatchView } from "./stopwatch-using-react-state-using-transitionhooks/StopwatchView";
import { useStopwatch } from "./stopwatch-using-react-state-using-transitionhooks/useStopwatch";
import type { Stopwatch } from "./stopwatch-common/types";

export function TransitionHooksDemo() {
  const stopwatch = useStopwatch() as Stopwatch;
  return <StopwatchView machine={stopwatch} />;
}
