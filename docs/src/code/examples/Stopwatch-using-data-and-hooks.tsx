import { before, effect, facade, setup, when } from "matchina";
import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { StopwatchDevView, tickEffect } from "./StopwatchCommon";

export function useStopwatch() {
  // Define the state machine
  const stopwatch = useMemo(() => {
    const model = Object.assign(
      facade(
        //state data creators
        {
          Stopped: () => ({ elapsed: 0 }),
          Ticking: (elapsed: number = 0) => ({ at: Date.now(), elapsed }),
          Suspended: (elapsed = 0) => ({ elapsed }),
        } as const,
        // transitions
        {
          Stopped: { start: "Ticking" },
          Ticking: {
            _tick: "Ticking",
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
        // initial state
        "Stopped",
      ),
      {
        elapsed: 0,
      },
    );
    setup(model.machine)(
      before((ev) => {
        ev.to.data.elapsed = ev.match(
          {
            stop: () => 0,
            clear: () => 0,
            _: () => ev.from.data.elapsed,
            _tick: () =>
              ev.from.data.elapsed +
              (Date.now() - ev.from.as("Ticking").data.at),
          },
          false,
        );
      }),
      effect(
        when(
          (ev) => ev.to.is("Ticking"),
          () => tickEffect(stopwatch._tick),
        ),
      ),
      effect((ev) => {
        model.elapsed = ev.to.data.elapsed;
      }),
    );
    return model;
  }, []);
  useMachine(stopwatch.machine);
  return stopwatch;
}

export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchDevView stopwatch={stopwatch} />;
}
