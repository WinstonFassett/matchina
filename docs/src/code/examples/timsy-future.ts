import { createFactoryMachine, defineStates, withApi } from "matchina";

// ---cut---
const states = defineStates({
  IDLE: () => ({}),
  DETECTING_RESIZE: (initialX: number) => ({ initialX }),
  RESIZING: (x: number) => ({ x }),
});

const machine = withApi(
  createFactoryMachine(
    states,
    {
      IDLE: {
        MOUSE_DOWN: (x: number) => () => states.DETECTING_RESIZE(x),
      },
      DETECTING_RESIZE: {
        MOUSE_MOVE: (x: number) => (state: any) => {
          if (Math.abs(x - state.initialX) > 3) {
            return states.RESIZING(x);
          }

          return state;
        },
        // eslint-disable-next-line unicorn/consistent-function-scoping
        MOUSE_UP: () => () => states.IDLE(),
        // eslint-disable-next-line unicorn/consistent-function-scoping
        MOUSE_UP_RESIZER: () => () => states.IDLE(),
      },
      RESIZING: {
        MOUSE_MOVE: (x: number) => () => states.RESIZING(x),
        // eslint-disable-next-line unicorn/consistent-function-scoping
        MOUSE_UP: () => () => states.IDLE(),
      },
    },
    "IDLE",
  ),
);

machine.api.MOUSE_DOWN(2);
