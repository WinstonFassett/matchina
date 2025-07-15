
import { StopwatchDevView } from "../stopwatch-common/StopwatchDevView";
import { useStopwatch } from "./useStopwatch";

export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchDevView stopwatch={stopwatch} />;
}
