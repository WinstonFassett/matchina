import { MachineVisualizer } from "@components/MachineVisualizer";
import type { Stopwatch } from "./types";
import { StopwatchView } from "./StopwatchView";

export function StopwatchDevView({ stopwatch }: { stopwatch: Stopwatch }) {
  return (
    <MachineVisualizer
      machine={stopwatch as any}
      AppView={({ machine }) => <StopwatchView machine={machine} />}
      showRawState
    />
  );
}
