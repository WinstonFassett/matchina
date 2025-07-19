import { facade } from "matchina";
import { useMachine } from "matchina/react";
import { useState, useMemo, useEffect } from "react";
import { tickEffect } from "../lib/tick-effect";

export function useStopwatch() {
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
      facade(
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
