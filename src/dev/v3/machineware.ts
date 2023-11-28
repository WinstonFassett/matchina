import { Middleware, runMiddleware } from "../../extras/middleware";
import { HasMethod, methodUse } from "./method";
import { getRegistrants, registrar, runEffects } from "./registrants";
import { disposers } from "./setup";
import { ChangeCommandEvent } from "./types";

// const MiddlewareKeys = ['begin', 'guard', 'before', 'handle', 'update', 'end'] as const;
// type MiddlewareKeys = typeof MiddlewareKeys[number]

// const EffectKeys = ['effect', 'enter', 'exit', 'notify', ...MiddlewareKeys] as const;
// type EffectKeys = typeof EffectKeys[number]


// const PhaseKeys = EffectKeys
// type PhaseKeys = typeof PhaseKeys[number]

type Effectware<T> = (ev: T) => void;

type MachineMiddleware<T> = {
  transition: Middleware<T>;
  begin: Middleware<T>;
  guard: Middleware<T>; // require completion of all guards
  before: Middleware<T>;
  handle: Middleware<T>;
  update: Middleware<T>;
};
type MiddlewareKeys = keyof MachineMiddleware<any>

type MachineEffectware<T> = {
  effect: Effectware<T>;
  exit: Effectware<T>;
  enter: Effectware<T>;
  after: Effectware<T>;
  notify: Effectware<T>;
  end: Effectware<T>;
};
type MachineMiddlewareEffectware<T> = {
  transition: Effectware<T>;
  begin: Effectware<T>;
  guard: Effectware<T>; // require completion of all guards
  before: Effectware<T>;
  handle: Effectware<T>;
  update: Effectware<T>;
};
type EffectKeys = keyof MachineEffectware<any>

type PhaseKeys = MiddlewareKeys | EffectKeys

type Machineware<T> = MachineMiddleware<T> & MachineEffectware<T>

export const filter = <T>(fn: (value: T) => boolean): Middleware<T> => {
  return (target: T, next) => {
    if (fn(target)) next(target);
  }
}

const PHASES = '_phase';

export function middlewareSetup <E extends ChangeCommandEvent>(enhancers: HookConfig<{
  [k: string]: Middleware<E>
  // transition: Middleware<E>,
  // begin: Middleware<E>,
  // guard: Middleware<E>, // require completion of all guards
  // before: Middleware<E>,
  // handle: Middleware<E>,
  // update: Middleware<E>,
}>) {
  return phaseSetup<E>(enhancers, 'mw')
}

const NotSet = {}

// const MIDDLEWARE = '_mw'

export function middlewareExtension<Type extends string, Kind extends string, E> (  
  type: Type,
  kind = MIDDLEWARE as Kind,
) {
  return <T extends HasMethod<Type>>(target: T) => {
    // use conditionally
    
    return methodUse(type)(inner => {
      return (ev: E) => {
        const middlewares = getRegistrants<Middleware<E>, Kind, any>(target, kind, type)
        if (middlewares.length == 0) return inner(ev)
        let result = NotSet as ReturnType<typeof inner>
        runMiddleware(middlewares, ev, ev => {
          result = inner(ev)
        })
        if (result !== NotSet) return result
      }
    })
  }
}

const EFFECTWARE = '_e'

export function effectwareExtension <Type extends string, Kind extends string, E> (  
  type: Type,
  kind = EFFECTWARE as Kind,
) {
  return <T extends HasMethod<Type>>(target: T) => {
    return methodUse(type)(inner => {
      return (ev: E) => {
        const effects = getRegistrants<Middleware<E>, Kind, any>(
          target,
          kind,
          type,
        );      
        if (effects.length>0) runEffects(effects, [ev])
      }
    })(target)
  }
}

// type Funcware<P extends any[], R> = (invocation: [params: P, result: R], next: (invocation: [params: P, result: R]) => void) => void;


type HookConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

function phaseSetup<E extends ChangeCommandEvent>(
  record: HookConfig<Machineware<E>>,
) {
  return <T>(target: T) => {
    // const onPhase = phases('mw')(target as any);
    // return disposers(
    //   Object.keys(record).map((key) => {
    //     const listener = record[key];
    //     if (!listener) return () => {};
    //     return Array.isArray(listener)
    //       ? disposers(
    //           listener.map((listener) =>
    //             onPhase(key as PhaseKeys, listener),
    //           ),
    //         )
    //       : onPhase(key as PhaseKeys, listener);
    //   }),
    // );
  };
}

// function listenware() {}
const LISTENERS = 'l'
const MIDDLEWARE = 'mw'
// function 

export function listenerSetup <E extends ChangeCommandEvent>(
  listeners: HookConfig<{
    [k: string]: Effectware<E>
    // effect: Effectware<E>,
    // exit: Effectware<E>,
    // enter: Effectware<E>,
    // after: Effectware<E>,
    // notify: Effectware<E>,
    // end: Effectware<E>,
  }>
) {
  return phaseSetup<E>(listeners)

}

/*
## Dev Notes

Concerns:
- register things at target[kind][type]
- cleanup when done
- list registered things for kind/type
- register method type middleware extension on target 
- register method type listeners extension on target

*/

// type PhaseTarget<E, MiddlewareKeys extends string, EffectKeys extends string> = {
//   [K in MiddlewareKeys]: (ev: E) => E;
// } & {
//   [K in EffectKeys]: (ev: E) => void;
// }

// function phases<K extends string, E>(
//   kind: K
// ){
//   return <T>(target: T) => {
//     const toDispose = [] as (() => void)[];
//     const {register, getRegistrants} = registrar<Middleware<E> | Effectware<E>, PhaseKeys, T>(
//       target,
//       function initRegistrar(record) {
//         return disposers(toDispose)
//         // return disposers(
//         //   ...middlewareKeys.map((key: any) => {
//         //     return methodExtend(target, key, (inner) => {
//         //       return ((...params: Parameters<typeof inner>) => {
//         //         // run in middleware
//         //         let result = undefined as ReturnType<typeof inner>;
//         //         runMiddleware(
//         //           getRegistrants<Middleware<E>, typeof PHASES, T>(
//         //             target,
//         //             PHASES,
//         //             key,
//         //           ),
//         //           result as any,
//         //           (...params) => {
//         //             result = inner(...params);
//         //           },
//         //         );
//         //         return result;
//         //       }) as typeof inner;
//         //     });
//         //   }),
//         //   ...effectKeys.map((key: any) => {
//         //     return methodExtend(target, key, (inner) => {
//         //       return ((...params: Parameters<typeof inner>) => {
//         //         inner(...params);
//         //         runEffects(
//         //           getRegistrants<Effectware<E>, typeof PHASES, T>(
//         //             target,
//         //             PHASES,
//         //             key,
//         //           ),
//         //           params,
//         //         );
//         //       }) as typeof inner;
//         //     });
//         //   }),
//         // );
//       },
//     );
//     const x: typeof register = (type, fn) => {
//       return () => {}
//     }

//   }
// }
