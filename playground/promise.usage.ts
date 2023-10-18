import { Expand } from "../src/utility-types";
import { createPromiseMachine } from "../src/promise";
import { delay } from "../src/delay";

const machine = createPromiseMachine((x: number) =>
  delay(x).then(() => `slept for ${x}ms`),
);

type X = Expand<typeof machine.events>;
const x: X = {} as X;

const it = machine.getState().match({
  Rejected: () => ({ kablamo: false }),
  _: () => ({ kablamo: true }),
});
console.log(it)

const checkState = () => console.log(machine.getState().match({  
  Resolved: res => `DONE: ${res}`,
  Rejected: err => `Error! ${err}`,
  _: () => `NOPE: ${machine.getState().state}`
}));
const reset = () => machine.update(c => ({...c, to: machine.states.Idle() }))

machine.events.execute(1000);
machine.events.reject(new Error("error"));
checkState()

reset()
machine.send("execute", [1]);
delay(2).then(checkState)
.then(() => {
  reset()
  machine.transitions.Idle.execute(2)
  delay(2).then(checkState)
})

