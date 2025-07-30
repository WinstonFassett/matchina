import { PromiseCallback, PromiseMachine } from "./promise-types";

export const handlePromise =
  <
    F extends PromiseCallback,
    Type extends string = "execute",
    Resolve extends string = "resolve",
    Reject extends string = "reject",
  >(
    makePromise: F,
    trigger = "execute" as Type,
    resolve = "resolve" as Resolve,
    reject = "reject" as Reject
  ) =>
  (
    machine: PromiseMachine<F> & {
      send: (type: Type | Resolve | Reject, ...params: any[]) => void;
    }
  ) => {
    const next = machine.handle;
    machine.handle = (ev) => {
      if (ev.type === trigger) {
        const promise = makePromise(...(ev.params[1] as Parameters<F>));
        const store = ev as any;
        store.promise = promise;
        store.done = promise
          .then((res) => machine.send(resolve, res))
          .catch((error) => machine.send(reject, error));
      }
      return next(ev);
    };
    return () => {
      machine.handle = next;
    };
  };
