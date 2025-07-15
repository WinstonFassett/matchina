import { facade } from "@lib/src";
import { useMachine } from "@lib/src/integrations/react";
import { useState, useMemo } from "react";
import { useStateEffects, useEventTypeEffect } from "../lib/matchina-hooks";
import { tickEffect } from "../lib/tick-effect";

export function useStopwatch() {
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
    []
  );
  // Define the state machine
  const stopwatch = useMemo(
    () => Object.assign(
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
        "Stopped"
      ),
      {
        elapsed,
      }
    ),
    []
  );
  useMachine(stopwatch.machine);
  useStateEffects(stopwatch.state);
  useEventTypeEffect(stopwatch.change, effects);
  stopwatch.elapsed = elapsed;
  return stopwatch;
}
