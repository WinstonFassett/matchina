import {
  defineStates,
  createMachine,
  createStoreMachine,
  addStoreApi,
  withSubscribe,
  setup,
  enter,
  when,
  effect,
} from "matchina";
import { tickEffect } from "../lib/tick-effect";

interface StopwatchState {
  elapsed: number;
  at: number;
}

const createStopwatchStore = () => {
  const store = createStoreMachine<StopwatchState>(
    { elapsed: 0, at: 0 },
    {
      tick: () => (change) => ({
        elapsed: change.from.elapsed + (Date.now() - change.from.at),
        at: Date.now(),
      }),
      start: () => (change) => ({
        elapsed: change.from.elapsed,
        at: Date.now(),
      }),
      resume: () => (change) => ({
        elapsed: change.from.elapsed,
        at: Date.now(),
      }),
      clear: () => () => ({ elapsed: 0, at: Date.now() }),
    }
  );
  return addStoreApi(withSubscribe(store));
};

export const createStopwatchMachine = () => {
  const states = defineStates({
    Stopped: undefined,
    Ticking: undefined,
    Suspended: undefined,
  });

  const store = createStopwatchStore();

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
    effect((ev) => {
      if (ev.type === "_tick") store.api.tick();
      if (ev.type === "start") store.api.start();
      if (ev.type === "resume") store.api.resume();
      if (ev.type === "clear") store.api.clear();
    }),
    enter(
      when(
        (ev) => ev.to.is("Ticking"),
        () => tickEffect(() => machine.send("_tick"))
      )
    )
  );

  return Object.assign(machine, { store });
};
