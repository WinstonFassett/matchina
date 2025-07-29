import { setup, transitionHooks } from "matchina";
import { useMachine } from "matchina/react";
import { useMemo, useState } from "react";
import { tickEffect } from "../lib/tick-effect";
import { createStopwatch } from "./machine";

export function useStopwatch() {
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const [elapsed, setElapsed] = useState(0);
  const stopwatch = useMemo(() => {
    const machine = Object.assign(createStopwatch(), {
      startTime,
      elapsed,
    });
    setup(machine)(
      transitionHooks(
        { to: "Ticking", enter: () => tickEffect(() => {
          setElapsed(Date.now() - (machine.startTime ?? 0));
        })},
        { type: "start", effect: () => {
          setStartTime(Date.now());
        }},
        { from: "Ticking", type: "clear", effect: () => {
          setStartTime(Date.now());
        }},
        { from: "Suspended", type: "clear", effect: () => {
          setStartTime(undefined);
        }},
        { type: "clear", effect: () => setElapsed(0) },
        { type: "stop", effect: () => setElapsed(0) },
        { type: "resume", effect: () => setStartTime(Date.now() - (machine.elapsed ?? 0)) }
      )
    );
    return machine;
  }, []);
  useMachine(stopwatch);
  stopwatch.startTime = startTime;
  stopwatch.elapsed = elapsed;
  return stopwatch;
}
