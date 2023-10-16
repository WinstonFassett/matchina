import { onLifecycle } from "../src/lifecycle";
import { createMachine } from "../src/machine";
import { onTransition } from "../src/on-transition";
import { createPromiseMachine } from "../src/promise";
import { createStates } from "../src/states";

// usage
const machine = createMachine(
  createStates({
    Heating() {},
    Boiling() {},
  }),
  {
    Heating: {
      change: "Boiling",
    },
    Boiling: {},
  },
);

function guard(ev: typeof machine.event) {
  return ev.match({
    change: () => {
      return true;
    },
    _: () => true,
  });
}

onTransition(machine, (transition, ev) => {
  if (!guard(ev)) {
    return;
  }
  return transition(ev) as any;
});

onLifecycle(machine, {
  Heating: {
    change: {
      guard: (event) =>
        event.from.match({
          _() {
            return true;
          },
        }),
      before(ev) {
        ev.to.match({ Heating() {}, _() {} });
      },
    },
  },
  Boiling: {},
});

const somePromiseMachine = createPromiseMachine<(x: number) => Promise<any>>();
onLifecycle(somePromiseMachine, {
  IDLE: {
    execute: {
      after: (event) =>
        fetch("/something")
          .then(somePromiseMachine.events.resolve)
          .catch(somePromiseMachine.events.reject),
    },
  },
});
somePromiseMachine.events.execute(123);
