// lifecycle-v2.ts
import { KeyedChangeEventFilter, isKeyedChangeEvent } from '../extras/typeguards';
import { SwapFunc } from '../types';

type Disposer = () => void;
export type Sink<E> = (event: E) => void;
export type Middleware<E> = (event: E, next: (event: E) => void) => void;

export function composeMiddleware<E>(...middlewares: Middleware<E>[]): Middleware<E> {
  return (event: E, next: (event: E) => void) => {
    let currentFn: (event: E) => void | Promise<void> = next;
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const middleware = middlewares[i];
      const previousFn = currentFn;
      currentFn = (event: E) => middleware(event, previousFn);
    }
    return currentFn(event);
  };
}

export const applyMiddleware = <E>(fn: Sink<E>, ...middlewares: Middleware<E>[]) =>  
   (event: E) => composeMiddleware(...middlewares)(event, fn)

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


export const when = <E>(filter: KeyedChangeEventFilter<E>) => (...middleware: Middleware<E>[]) =>
  composeMiddleware( 
    guard<E>(ev => isKeyedChangeEvent(ev, filter)),
    ...middleware
  );

type StateChangeMachine<E> = {
  getChange: () => E;
  update: SwapFunc<E>
};

export function enhanceMachine<E>(
  machine: StateChangeMachine<E>
): (...middleware: Middleware<E>[]) => Disposer {
  const context = machine as any;
  if (context.use) return context.use;
  context.use = (...middleware: Middleware<E>[]) => {
    const origUpdate = machine.update;
    const composed = composeMiddleware(...middleware)
    machine.update = (updater) => {
      origUpdate(function enhancedUpdater (value) {        
        composed(value, updater);
        return value
      })
    }
    return () => {
      machine.update = origUpdate;
    };
  };
  return context.use;
}
