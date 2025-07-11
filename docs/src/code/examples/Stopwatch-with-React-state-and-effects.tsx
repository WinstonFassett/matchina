import { matchina } from "matchina";
import { useMachine } from "matchina/react";
import { useEffect, useMemo, useState } from "react";
import { StopwatchDevView, tickEffect } from "./StopwatchCommon";

function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const effects = useMemo(
    () => ({
      run: () => {
        let lastTick = Date.now();
        return tickEffect(() => {
          const now = Date.now();
          setElapsed(stopwatch.elapsed + now - lastTick);
          lastTick = now;
        });
      },
      clear: () => {
        setElapsed(0);
      },
    }),
    [],
  );
  // Define the state machine
  const stopwatch = useMemo(() => {
    return Object.assign(
      matchina(
        {
          Stopped: {},
          Ticking: {},
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
        elapsed: elapsed,
        setElapsed: setElapsed,
      },
    );
  }, []);
  stopwatch.elapsed = elapsed;
  useMachine(stopwatch.machine);
  useEffect(() => {
    if (stopwatch.change.type === "clear") {
      effects.clear();
    }
    return stopwatch.state.match(
      {
        Ticking: effects.run,
        Stopped: () => effects.clear,
      },
      false,
    );
  }, [stopwatch.state]);
  return stopwatch;
}

export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchDevView stopwatch={stopwatch} />;
}
