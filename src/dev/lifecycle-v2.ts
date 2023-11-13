// lifecycle-v2.ts
import { KeyedChangeEventFilter, isKeyedChangeEvent } from '../extras/typeguards';
import { SwapFunc } from '../types';
import { StateEventHookConfig } from '../extras/lifecycle-types'
import { StateMachineEvent, StatesFactory, TransitionConfig } from '../machine-types';

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

export const guardware: <E>(test: (event: E) => boolean) => Middleware<E> 
  = (test) => (event, next) => {
    console.log('guarding!', test(event))
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

export const conditionware = <E>(
  test: (event: E) => boolean,
  ...middlewares: Middleware<E>[]) => {
    const composed = composeMiddleware(...middlewares)
    return (event: E, next: (event: E) => void) => {
      console.log('CONDITION TEST', test(event))
      if (test(event)) composed(event, next);
      else next(event);
    };
  }


export const when = <E>(filter: KeyedChangeEventFilter<E>) => (...middleware: Middleware<E>[]) =>
  conditionware( 
    ev => isKeyedChangeEvent(ev, filter),
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
    const bound = origUpdate.bind(machine)
    const composed = composeMiddleware(...middleware)
    console.log('USE')
    machine.update = (updater) => {
      bound((current:any) => {
        console.log('START ENHANCED UPDATE', current?.from?.key??'none', current.type, current.to.key)
        console.group()
        console.log('Updater')
        console.group()        
        console.groupEnd()
        console.log('Composed')
        console.group()
        let enhancedResult: any
        composed(updater(current), (result => {
          enhancedResult = result
          console.log('RESULT', enhancedResult?.to.key)          
        }));
        console.groupEnd()
        console.log('End Composed', enhancedResult?.to.key)
        console.groupEnd()
        console.log('FINISH ENHANCED UPDATE')        
        return enhancedResult ?? current
      })
    }
    return () => {
      machine.update = origUpdate;
    };
  };
  return context.use;
}

export function lifecycle<
Transitions extends TransitionConfig<States>,
States extends StatesFactory<any>,
>(
  config: StateEventHookConfig<Transitions, States>,
): Middleware<StateMachineEvent<Transitions, States>> {
  type E = StateMachineEvent<Transitions, States>
  const wares: Middleware<E> [] = []
  for (const fromKey in config) {
    const fromStateConfig = config[fromKey]
    if (!fromStateConfig) continue;
    const { enter, leave } = fromStateConfig
    if (enter || leave) {
      wares.push(when<E>({ 
        from: fromKey === '*' ? undefined : fromKey as any,        
      })(
        ((ev, next) => {          
          for (const fn of asArray(enter)) {
            fn?.(ev)                
          }
          next(ev)
          return () => {
            for (const fn of asArray(leave)) {
              fn?.(ev)                
            }
          }
        })
      ))
    }
    const { on } = fromStateConfig
    if (on) {
      for (const eventKey in on) {
        const eventConfig = on[eventKey]
        const eventwares: Middleware<E>[] = []
        if (!eventConfig) continue;
        const { guard, handle, before, after } = eventConfig
        if (guard) {
          eventwares.push(when<E>({ 
            from: fromKey === '*' ? undefined : fromKey as any,
            type: eventKey === '*' ? undefined : eventKey as any            
          })(
            (ev, next) => { 
              if (asArray(guard).every(g => g(ev))) next(ev)
            }
          ))          
        }
        if (handle) {  
          // need to splice
          wares.push(...asArray(handle))
        }
        if (before||after) {
          eventwares.push(
            listen((ev) => {              
              for (const fn of asArray(before)) {
                fn?.(ev)                
              }
              return () => {
                for (const fn of asArray(after)) {
                  fn?.(ev)                
                }
              }
            })
          )
        }
        if (eventwares.length>0) {
          wares.push(when<E>({ 
            from: fromKey === '*' ? undefined : fromKey as any,
            type: eventKey === '*' ? undefined : eventKey as any            
          })(...eventwares))
        }
      }
    }
  }

  // next(current);

  return composeMiddleware(...wares);
}

const asArray = <T>(u: T) => Array.isArray(u) ? u : [u]
