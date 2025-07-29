import {
  defineStates,
  createMachine,
  setup,
  enter,
  when,
  effect,
  zen,
} from "matchina";
import { tickEffect } from "../lib/tick-effect";

export const createStopwatchMachine = () => {
  // Define states using defineStates
  const states = defineStates({
    Stopped: () => ({ elapsed: 0 }),
    Ticking: (elapsed = 0) => ({ elapsed, at: Date.now() }),
    Suspended: (elapsed = 0) => ({ elapsed }),
  });

  // Create the base machine with states, transitions, and initial state
  const baseMachine = createMachine(
    states,
    {
      Stopped: { start: "Ticking" },
      Ticking: {
        _tick: () => (ev) =>
          states.Ticking(
            !ev ? 0 : ev?.from.data.elapsed + (Date.now() - ev?.from.data.at)
          ),
        stop: "Stopped",
        suspend: () => (ev) => states.Suspended(ev?.from.data.elapsed),
        clear: "Ticking",
      },
      Suspended: {
        stop: "Stopped",
        resume: () => (ev) => states.Ticking(ev?.from.data.elapsed),
        clear: "Suspended",
      },
    },
    "Stopped"
  );

  // Use zen to enhance the machine with utility methods
  const machine = Object.assign(zen(baseMachine), {
    elapsed: 0,
  });
  setup(machine)(
    enter(
      when(
        (ev) => ev.to.is("Ticking"),
        () => tickEffect(machine._tick)
      )
    ),
    effect((ev) => {
      machine.elapsed = ev.to.data.elapsed ?? 0;
    })
  );
  return machine;
};
