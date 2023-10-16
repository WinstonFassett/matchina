import { createMachine } from "../src/machine";
import { createPromiseMachine } from "../src/promise";
import { createStates as states } from "../src/states";
import { delayed } from "../src/delay";

const promise = (fn: any) => ({ machine: createPromiseMachine(fn) });
const machine = (statesConfig: any, transitionsConfig: any) => ({
  machine: createMachine(statesConfig, transitionsConfig),
});

const rootMachine = createMachine(
  states({
    Idle: undefined,
    First: promise(delayed(1000, "First Result")),
    Second: machine(
      states({
        Idle: undefined,
        Executing: promise(delayed(2000, "Second Result")),
        Nested: promise(delayed(1500, "Nested Result")),
      }),
      {
        Idle: { start: "Executing" },
        Executing: { done: "Nested" },
        Nested: { done: "Done" },
      },
    ),
    Done: undefined,
  }),
  {
    Idle: { start: "First" },
    First: { done: "Second" },
    Second: { done: "Done" },
    Done: {},
  },
);
