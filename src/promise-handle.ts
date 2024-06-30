import { PromiseCallback, PromiseMachine } from "./promise-machine";

export const handlePromise =
  <
    F extends PromiseCallback,
    Type = "execute",
    Resolve = "resolve",
    Reject = "reject",
  >(
    makePromise: F,
    trigger = "execute" as Type,
    resolve = "resolve" as Resolve,
    reject = "reject" as Reject,
  ) =>
  (machine: PromiseMachine<F>) => {
    const next = machine.handle;
    machine.handle = (ev) => {
      if (ev.type === trigger) {
        const promise = makePromise(...(ev.params as Parameters<F>));
        const store = ev as any;
        store.promise = promise;
        store.done = promise
          .then((res) => machine.send(resolve as any, res))
          .catch((error) => machine.send(reject as any, error));
      }
      return next(ev);
    };
    return () => {
      machine.handle = next;
    };
  };
