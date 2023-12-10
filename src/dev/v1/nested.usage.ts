import { defineMachine } from "./machine";
import { createPromiseMachine } from "./extras/promise";
import { defineStates as states } from "./states";
import { delayer } from "./extras/delay";
import { withEvents } from "./extras/with-events";

const promise = (fn: any) => ({ machine: createPromiseMachine(fn) });
const submachine = (statesConfig: any, transitionsConfig: any) => ({
  machine: defineMachine(statesConfig, transitionsConfig),
});

const Machine = defineMachine(
  states({
    Idle: undefined,
    First: promise(delayer(1000, "First Result")),
    Second: submachine(
      states({
        Idle: undefined,
        Executing: promise(delayer(2000, "Second Result")),
        Nested: promise(delayer(1500, "Nested Result")),
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
const rootMachine = withEvents(Machine.create(Machine.states.Idle()));

const log = () => console.log({ rootMachine, last: rootMachine.getChange() });
log();
rootMachine.event.start();
log();
