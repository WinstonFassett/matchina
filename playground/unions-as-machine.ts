import { unionize } from "../src/unionize";

const states = unionize(
  {
    Idle: () => ({}),
    Done: (x: number) => ({ result: x }),
  },
  "state",
);

const events = unionize(
  {
    execute: (x: number) => x,
  },
  "event",
);

const transitions = {
  Idle: { execute: "Done" },
};

function transition<States extends typeof states, Events extends typeof events>(
  state: ReturnType<(typeof states)[keyof typeof states]>,
  event: ReturnType<(typeof events)[keyof typeof events]>,
) {
  state.match({
    Idle() {
      return event.match({
        execute(x) {
          return states.Done(x);
        },
      });
    },
    _() {},
  });
}
