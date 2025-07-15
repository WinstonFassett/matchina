import { facade } from "matchina";
import { useMachine } from "matchina/react";
import { useMemo, useState } from "react";
import {
  useEventTypeEffect,
  useStateEffects
} from "../stopwatch-common/matchina-hooks";
import { StopwatchDevView } from "../stopwatch-common/StopwatchDevView";
import { tickEffect } from "../stopwatch-common/tick-effect";

function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const effects = useMemo(
    () => ({
      clear: () => setElapsed(0),
      run: () => {
        let lastTick = Date.now();
        return tickEffect(() => {
          const now = Date.now();
          setElapsed(stopwatch.elapsed + now - lastTick);
          lastTick = now;
        });
      },
    }),
    [],
  );
  // Define the state machine
  const stopwatch = useMemo(
    () =>
      Object.assign(
        facade(
          {
            Stopped: { effects: [effects.clear] },
            Ticking: { effects: [effects.run] },
            Suspended: {},
          },
          {
            Stopped: {
              start: "Ticking",
            },
            Ticking: {
              stop: "Stopped",
              suspend: "Suspended",
              clear: "Ticking",
            },
            Suspended: {
              stop: "Stopped",
              resume: "Ticking",
              clear: "Suspended",
            },
          },
          "Stopped",
        ),
        {
          elapsed,
        },
      ),
    [],
  );
  useMachine(stopwatch.machine);
  useStateEffects(stopwatch.state);
  useEventTypeEffect(stopwatch.change, effects);
  stopwatch.elapsed = elapsed;
  return stopwatch;
}

export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchDevView stopwatch={stopwatch} />;
}
