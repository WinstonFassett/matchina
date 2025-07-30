import {
  defineStates,
  createMachine,
  setup,
  before,
  effect,
  when,
  assignEventApi,
} from "matchina";
import { tickEffect } from "../lib/tick-effect";

export const createStopwatchMachine = () => {
  // Define states using defineStates
  const states = defineStates({
    Stopped: () => ({ elapsed: 0 }),
    Ticking: (elapsed: number = 0) => ({ at: Date.now(), elapsed }),
    Suspended: (elapsed = 0) => ({ elapsed }),
  });

  // Create the base machine with states, transitions, and initial state
  const baseMachine = createMachine(
    states,
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
    "Stopped"
  );

  //Use assignEventApi to enhance the machine with utility methods
  const machine = Object.assign(assignEventApi(baseMachine), {
    elapsed: 0,
  });

  // Setup hooks directly on the machine (no need for .machine with assignEventApi)
  setup(machine)(
    before((ev) => {
      ev.to.data.elapsed = ev.match(
        {
          stop: () => 0,
          clear: () => 0,
          _: () => ev.from.data.elapsed,
          _tick: () =>
            ev.from.data.elapsed + (Date.now() - ev.from.as("Ticking").data.at),
        },
        false
      );
    }),
    effect(
      when(
        (ev) => ev.to.is("Ticking"),
        () => tickEffect(machine._tick)
      )
    ),
    effect((ev) => {
      machine.elapsed = ev.to.data.elapsed;
    })
  );
  return machine;
};
