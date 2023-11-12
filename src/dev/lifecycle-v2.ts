// lifecycle-v2.ts
import { KeyedChangeEventFilter, isKeyedChangeEvent } from '../extras/typeguards';

type Disposer = () => void;
export type Middleware<E> = (event: E, next: (event: E) => void) => void;

export function applyMiddleware<E>(targetFunction: (event: E) => void, ...middlewares: Middleware<E>[]): (event: E) => void {
  let currentFn: (event: E) => void | Promise<void> = targetFunction;
  for (const middleware of middlewares) {
    const previousFn = currentFn;
    currentFn = (event: E) => middleware(event, previousFn);
  }
  return currentFn;
}

export const guard: <E>(test: (event: E) => boolean) => Middleware<E> 
  = (test) => (event, next) => {
    if (test(event)) next(event);  
  };

type ExitListener<E> = (event: E) => void;
type EntryListener<E> = (event: E) => void | ExitListener<E>;

export const listen = <E>(entryListener: EntryListener<E>) =>
  (event: E, next: (event: E) => void) => {
    const exitListener = entryListener(event);
    next(event);
    exitListener?.(event);
  };


export const when = <E>(filter: KeyedChangeEventFilter<E>) => (...middleware) =>
  composeMiddleware( 
    guard<E>(ev => isKeyedChangeEvent(ev, filter)),
    ...middleware
  );

type StateChangeMachine<E> = {
  getChange: () => E;
  update: (event: E) => void;
};

export function enhanceMachine<E>(
  machine: StateChangeMachine<E>
): (...middleware: Middleware<E>[]) => Disposer {
  const context = machine as any
  if (context.use) return context.use;
  context.use = (...middleware) => {
    const origUpdate = machine.update;
    machine.update = applyMiddleware(origUpdate, ...middleware);
    return () => { machine.update = origUpdate }
  }    
  return context.use
}