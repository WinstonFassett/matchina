import {
  defineStates,
  createMachine,
  setup,
  enter,
  when,
  transitionHooks,
  atom,
} from "matchina";
import { tickEffect } from "../lib/tick-effect";

interface StopwatchState {
  elapsed: number;
  at: number;
}

export const createStopwatchMachine = () => {
  const states = defineStates({
    Stopped: undefined,
    Ticking: undefined,
    Suspended: undefined,
  });

  const initialState: StopwatchState = { elapsed: 0, at: 0 };
  const store = atom(initialState);

  const machine = createMachine(
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

  setup(machine)(
    transitionHooks(
      { type: "_tick", effect: () => store.update(s => ({ elapsed: s.elapsed + (Date.now() - s.at), at: Date.now() })) },
      { type: "start", effect: () => store.update(s => ({ ...s, at: Date.now() })) },
      { type: "resume", effect: () => store.update(s => ({ ...s, at: Date.now() })) },
      { type: "clear", effect: () => store.set({ elapsed: 0, at: Date.now() }) },
    ),
    enter(
      when(
        (ev) => ev.to.is("Ticking"),
        () => tickEffect(() => machine.send("_tick"))
      )
    )
  );

  return Object.assign(machine, { store });
};
