export {};

type Extender<A, B> = (input: A) => B;

// Usage

export type Extend<T> = {
  <A>(fn1: Extender<T, A>): A;
  <A, B>(fn1: Extender<T, A>, fn2: Extender<A, B>): B;
  <A, B, C>(fn1: Extender<T, A>, fn2: Extender<A, B>, fn3: Extender<B, C>): C;
  <A, B, C, D>(
    fn1: Extender<T, A>,
    fn2: Extender<A, B>,
    fn3: Extender<B, C>,
    fn4: Extender<C, D>,
  ): D;
  <A, B, C, D, E>(
    fn1: Extender<T, A>,
    fn2: Extender<A, B>,
    fn3: Extender<B, C>,
    fn4: Extender<C, D>,
    fn5: Extender<D, E>,
  ): E;
};

interface Extensible {
  extend: Extend<this>;
}


export type ExtendBuilder<T, X extends Extend<T>=Extend<T>> = (...params: Parameters<X>) => ExtendBuilder<ReturnType<X>>;

interface ExtensibleBuilder<C> {
  // extend: ;
}


class ExtensibleClass implements Extensible {
  // Implementation (the actual extend method)
  extend(...extenders: Extender<any, any>[]): any {
    return extenders.reduce((currentContext, extender) => {
      return extender(currentContext);
    }, this);
  }
}

// Usage

// Define extender functions
// type Extender<In, Out> = (target: In) => Out;

const withSubscribe = <M extends StateMachine>(machine: M) => ({
  ...machine,
  subscribe: (callback: () => void) => {},
});

const withZen = <M extends StateMachine>(machine: M) => ({
  ...machine,
  zen: () => {},
});

interface StateMachine extends Extensible {
  state: string;
  send(event: string): void;
}
// Usage example
const baseMachine: StateMachine = {
  state: "Idle",
  transition: (action: string) => {},
} as any;

const m = baseMachine.extend(
  withSubscribe,
  withZen,
  (it) => ({ ...it, whatever: { hello: "world" } }) as const,
  (it) => ({ ...it, moar: { stuff: "ok" } }) as const,
);

m.whatever.hello;
m.moar.stuff;
m.subscribe(() => {});
// const x = m
//   .extend(it => ({...it, hello: 'world'}))
//   .extend(it => ({...it, there: 'world'}))

// x.hello
// x.there
