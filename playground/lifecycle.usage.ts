import { onLifecycle } from "../src/lifecycle";
import { defineMachine } from "../src/machine";
import { onTransition } from "../src/on-transition";
import { createPromiseMachine } from "../src/promise";
import { createStates } from "../src/states";

// usage
const Machine = defineMachine(
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
const machine = Machine.create(Machine.states.Heating());
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

const somePromiseMachine = createPromiseMachine<any, number>();
onLifecycle(somePromiseMachine, {
  Idle: {
    execute: {
      after: (event) =>
        fetch("/something")
          .then(somePromiseMachine.events.resolve)
          .catch(somePromiseMachine.events.reject),
    },
  },
});
somePromiseMachine.events.execute(123);
