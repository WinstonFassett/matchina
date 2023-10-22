import { defineMachine, defineStates } from "../src";

const states = defineStates({
  IDLE: () => ({}),
  DETECTING_RESIZE: (initialX: number) => ({ initialX }),
  RESIZING: (x: number) => ({ x })
});

const Machine = defineMachine(states, {
  IDLE: {
    MOUSE_DOWN: (x: number) => () => states.DETECTING_RESIZE(x)
  },
  DETECTING_RESIZE: {
    MOUSE_MOVE: (x: number) => (ev, m) => {
      const state = m.getState() as any;
      if (Math.abs(x - state.initialX) > 3) {
        return states.RESIZING(x);
      }

      return state;
    },
    // eslint-disable-next-line unicorn/consistent-function-scoping
    MOUSE_UP: () => () => states.IDLE(),
    // eslint-disable-next-line unicorn/consistent-function-scoping
    MOUSE_UP_RESIZER: () => () => states.IDLE()
  },
  RESIZING: {
    MOUSE_MOVE: (x: number) => () => states.RESIZING(x),
    // eslint-disable-next-line unicorn/consistent-function-scoping
    MOUSE_UP: () => () => states.IDLE()
  }
});
const machine = Machine.create(states.IDLE());
machine.event.MOUSE_DOWN(2)