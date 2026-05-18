import { createMachine, defineStates, assignEventApi } from "matchina";
import { useMachine } from "matchina/react";
import { useEffect, useMemo, useState } from "react";
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

  const stopwatch = useMemo(() => {
    const states = defineStates({
      Stopped: { effects: [effects.clear] },
      Ticking: { effects: [effects.run] },
      Suspended: {},
    });

    return Object.assign(assignEventApi(createMachine(
      states,
      {
        Stopped: { start: "Ticking" },
        Ticking: { stop: "Stopped", suspend: "Suspended", clear: "Ticking" },
        Suspended: { stop: "Stopped", resume: "Ticking", clear: "Suspended" },
      },
      "Stopped"
    )), { elapsed });
  }, []);

  useMachine(stopwatch);
  const state = stopwatch.getState();
  useEffect(() => {
    const fns: (() => (() => void) | void)[] = (state.data as any)?.effects ?? [];
    const cleanups = fns.map((fn) => fn()).filter(Boolean) as (() => void)[];
    return () => cleanups.forEach((fn) => fn());
  }, [state]);
  stopwatch.elapsed = elapsed;
  return stopwatch;
}
