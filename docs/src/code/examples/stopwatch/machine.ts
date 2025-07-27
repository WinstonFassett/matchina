import {
  defineStates,
  createMachine,
  setup,
  enter,
  when,
  effect,
  zen,
  before,
} from "matchina";
import { tickEffect } from "../lib/tick-effect";

export const createStopwatchMachine = () => {
  // Define states using defineStates
  const states = defineStates({
    Stopped: (elapsed = 0) => ({ elapsed }),
    Ticking: (elapsed = 0) => ({ elapsed, at: Date.now() }),
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
    states.Stopped()
  );

  // Use zen to enhance the machine with utility methods
  const machine = Object.assign(zen(baseMachine), {
    elapsed: 0,
  });

  // Setup hooks directly on the machine (no need for .machine with zen)
  setup(machine)(
    // Before transition handler
    before((ev) => {
      if (ev.type === "_tick" && ev.from.is("Ticking")) {
        ev.to.data.elapsed =
          ev.from.data.elapsed + (Date.now() - ev.from.data.at);
      }
      if (ev.type === "clear") {
        ev.to.data.elapsed = 0;
      }
      return () => {};
    }),
    // Effect when entering Ticking state
    enter(
      when(
        (ev) => ev.to.is("Ticking"),
        () => tickEffect(machine._tick)
      )
    ),
    // Effect for all transitions - update elapsed field
    effect((ev) => {
      machine.elapsed = ev?.to.data.elapsed ?? 0;
    })
  );

  return machine;
};
