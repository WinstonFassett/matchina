export {}
// Define your base StateMachine type
interface StateMachine {
  state: string;
  transition: (action: string) => void;
  extend: <R>(extender: Extender<this, R>) => R;
};

// Define extender functions
type Extender<In, Out> = (target: In) => Out;

const withSubscribe = <M extends StateMachine>(machine: M) => ({
  ...machine,
  subscribe: (callback: () => void) => {
  },
});

const withZen = <M extends StateMachine>(machine: M) => ({
  ...machine,
  zen: () => {
  },
});

// Usage example
const baseMachine: StateMachine = {
  state: 'Idle',
  transition: (action: string) => { },
} as any;

const m = baseMachine
  .extend(withSubscribe)
  .extend(withZen)
  .extend(it => ({...it, whatever: {hello: 'world'} } as const));
  
m.whatever.hello
m.subscribe(() => {})


type Func<A, B> = (arg: A) => B;

function pipe<A, B, C>(f1: Func<A, B>, f2: Func<B, C>): Func<A, C>;
function pipe<A, B, C, D>(f1: Func<A, B>, f2: Func<B, C>, f3: Func<C, D>): Func<A, D>;
function pipe<A, B, C, D, E>(f1: Func<A, B>, f2: Func<B, C>, f3: Func<C, D>, f4: Func<D, E>): Func<A, E>;
function pipe<A, B, C, D, E, F>(
  f1: Func<A, B>,
  f2: Func<B, C>,
  f3: Func<C, D>,
  f4: Func<D, E>,
  f5: Func<E, F>
): Func<A, F>;
function pipe(...functions: Function[]): Function {
  return (arg: any) => functions.reduce((result, func) => func(result), arg);
}

const composedMachine = pipe(withSubscribe, withZen)(baseMachine);

const makeZen = pipe(withSubscribe, withZen);
const m1 = makeZen(baseMachine);

