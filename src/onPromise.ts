import { PromiseCallback, PromiseMachine } from "./promise";


export function onPromise<F extends PromiseCallback, Type = 'execute', Resolve = 'resolve', Reject = 'reject'>(
  machine: PromiseMachine<F>,
  makePromise: F,
  trigger = 'execute' as Type,
  resolve = 'resolve' as Resolve,
  reject = 'reject' as Reject
) {
  const next = machine.handle;
  machine.handle = (ev) => {
    if (ev.type === trigger) {
      const promise = makePromise(...(ev.params as Parameters<F>));
      const store = machine as any;
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
}
