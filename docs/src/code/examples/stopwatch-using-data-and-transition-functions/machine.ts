import { facade, setup, enter, when, effect } from "@lib/src";
import { tickEffect } from "../lib/tick-effect";

export const createStopwatchMachine = () => {
  const model = Object.assign(
    facade(
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
          _tick: () => (ev) => Ticking(
            !ev
              ? 0
              : ev?.from.data.elapsed + (Date.now() - ev?.from.data.at)
          ),
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
      ({ Stopped }) => Stopped()
    ),
    {
      elapsed: 0,
    }
  );
  setup(model.machine)(
    enter(
      when(
        (ev) => ev.to.is("Ticking"),
        () => tickEffect(model._tick)
      )
    ),
    effect((ev) => {
      model.elapsed = ev.to.data.elapsed ?? 0;
    })
  );
  return model;
};
