import React, { useMemo } from "react";
import { effect, enter, setup, when } from "../src";
import { useMachine } from "../src/integrations/react";
import { StopwatchDevView, tickEffect } from "./StopwatchCommon";
import { matchina } from "../src/matchina";

function useStopwatch() {
  // Define the state machine
  const stopwatch = useMemo(() => {
    const model = Object.assign(matchina(
      //state data creators
      {
        Stopped: () => ({ elapsed: 0 }),
        Ticking: (elapsed = 0) => ({ elapsed, at: Date.now() }),
        Suspended: (elapsed = 0) => ({ elapsed }),
      },
      // transitions
      ({ Stopped, Ticking, Suspended }) => ({
        Stopped: { start: Ticking },
        Ticking: {
          _tick: () => (ev) => Ticking(!ev ? 0 : ev?.from.data.elapsed + (Date.now() - ev?.from.data.at)),
          stop: Stopped,
          suspend: () => (ev) => Suspended(ev?.from.data.elapsed),
          clear: Ticking,
        },
        Suspended: {
          stop: Stopped,
          resume: () => (ev) => Ticking(ev?.from.data.elapsed),
          clear: Suspended,
        },
      }),
      // initial state
      ({Stopped}) => Stopped(),
    ), {
      elapsed: 0
    });
    setup(model.machine)(
      enter(when(ev => ev.to.is("Ticking"), () => tickEffect(model._tick))),
      effect(ev => { stopwatch.elapsed = ev.to.data.elapsed ?? 0 })
    )
    return model;
  }, []);
  useMachine(stopwatch.machine);
  return stopwatch;
}

export function Stopwatch () {
  const stopwatch = useStopwatch()
  return <StopwatchDevView stopwatch={stopwatch} />
}

