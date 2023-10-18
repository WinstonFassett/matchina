import { Expand } from "../src/utility-types";
import { createPromiseMachine } from "../src/promise";

// Usage
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const machine = createPromiseMachine((x: number) =>
  sleep(x).then(() => `slept for ${x}ms`),
);

// strongly-typed params on every thing below
machine.states.Rejected(new Error("error"));

type X = Expand<typeof machine.events>;
const x: X = {} as X;
machine.events.reject(new Error("error"));
machine.states.Pending(1000);
machine.events.execute(1000);

machine.transitions.Idle.execute(1000); // should require number
machine.transitions.Pending.resolve(""); // should require string
machine.transitions.Pending.reject(new Error("error")); // this should require error

machine.send("execute", 123);

machine.getLast().match({
  reject: (error: Error) => console.log({ error }),
  _: () => {},
});

machine.states.Rejected(new Error("error")).match({
  Rejected(error) {
    console.log(error);
  },
  _() {},
});

const it = machine.getState().match({
  _: () => ({ kablamo: false }),
});
it.kablamo = true