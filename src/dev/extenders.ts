import { withEvents } from "../extras/with-events";

export {};

// Define your base StateMachine type
type StateMachine = {
  state: string;
  transition: (action: string) => void;
};

// Define extender functions
type Extender<T> = (target: T) => any;

const withSubscribe = <M extends StateMachine>(machine: M) => ({
  ...machine,
  subscribe: (callback: () => void) => {
    // Implement subscribe logic here
  },
});

const withZen = <M extends StateMachine>(machine: M) => ({
  ...machine,
  zen: () => {
    // Implement zen logic here
  },
});

function composeFromExtensions<T>(target: T, ...extenders: Extender<T>[]) {
  return extenders.reduce((acc, extender) => extender(acc), target);
}

// Usage example
const baseMachine: StateMachine = {
  state: "Idle",
  transition: (action: string) => {
    // Implement transition logic here
  },
};

function compose<T, Fns extends ((arg: T) => any)[]>(initial: T, ...fns: Fns) {
  return fns.reduce((acc, fn) => fn(acc), initial);
}
const subscribableMachine = withSubscribe(baseMachine);

const reducedMachine = ([withSubscribe, withZen] as const).reduce(
  (machine, extender) => extender(machine),
  baseMachine,
);

function compose2<T, U, V, Y>(
  f: (x: T) => U,
  g: (y: Y) => T,
  h: (z: V) => Y,
): (x: V) => U {
  return (x: V) => f(g(h(x)));
}

const pipe = <T extends any[], U>(
  fn1: (...args: T) => U,
  ...fns: Array<(a: U) => U>
) => {
  const piped = fns.reduce(
    (prevFn, nextFn) => (value: U) => nextFn(prevFn(value)),
    (value) => value,
  );
  return (...args: T) => piped(fn1(...args));
};

const composedMachine = compose2(baseMachine, withSubscribe, withZen);
composedMachine;
// You can now access properties and methods from the extended machine
composedMachine.state; // Access state property
composedMachine.transition("someAction"); // Call transition method
composedMachine.subscribe(() => {}); // Call subscribe method
composedMachine.zen(); // Call zen method
