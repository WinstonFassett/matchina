import { Expand } from "../src/utility-types";
import { createPromiseMachine } from "../src/promise";

// Usage
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const machine = createPromiseMachine((x: number) =>
  sleep(x).then(() => `slept for ${x}ms`),
);

// strongly-typed params on every thing below
machine.states.REJECTED(new Error("error"));

type X = Expand<typeof machine.events>;
const x: X = {} as X;
machine.events.reject(new Error("error"));
machine.states.PENDING(1000);
machine.events.execute(1000);

machine.transitions.IDLE.execute(1000); // should require number
machine.transitions.PENDING.resolve(""); // should require string
machine.transitions.PENDING.reject(new Error("error")); // this should require error

machine.send("execute", 123);

// TODO
machine.event.match({
  reject: (error: Error) => console.log({ error }),
  _: () => {},
});

machine.states.REJECTED(new Error("error")).match({
  REJECTED(error) {
    console.log(error);
  },
  _() {},
});

machine.getState().match({
  _: () => {},
});
