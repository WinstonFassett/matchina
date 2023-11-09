
export {}
// Define your base StateMachine type
interface StateMachine {
  state: string;
  transition: (action: string) => void;
  extend<R>(extender: Extender<this, R>): R;
  into<U>(cb: (val: this) => U): U;
}

// Define extender functions
type Extender<In, Out> = (target: In) => Out;

const withSubscribe = <M extends StateMachine>(machine: M) => ({
  ...machine,
  subscribe: (callback: () => void) => {},
});

const withZen = <M extends StateMachine>(machine: M) => ({
  ...machine,
  zen: () => {},
});

// Usage example
const baseMachine: StateMachine = {
  state: 'Idle',
  transition: (action: string) => {},
} as any;

const x = baseMachine.extend(it => ({ ...it, yooo: 'hello' })).extend(it => ({ ...it, thing2: 'world' }))

interface Pipe<T> {
  val: T;
  into<U>(cb: (val: T) => U): Pipe<U>;
}

function pipe<T>(val: T): Pipe<T> {
  return { val, into: cb => pipe(cb(val)) }
}
  
// // Example Usage
export const inverseEuler = (e: number) => pipe(e)
  .into(x => ('hello'))
  .into(s => s.length)
  .into(n => n + 1)
  .val


  