import { Middleware, runMiddleware } from "../../extras/middleware";
import { methodExtend } from "./method";
import { getRegistrants, registrar, runEffects } from "./registrants";
import { disposers } from "./setup";
import { StateMachinery } from "./state-machine";
import { ChangeCommandEvent } from "./types";

const MiddlewareKeys = ['begin', 'guard', 'before', 'handle', 'update', 'end'] as const;
type MiddlewareKeys = typeof MiddlewareKeys[number]

const EffectKeys = ['effect', 'enter', 'exit', 'notify', ...MiddlewareKeys] as const;
type EffectKeys = typeof EffectKeys[number]


const PhaseKeys = EffectKeys
type PhaseKeys = typeof PhaseKeys[number]

type Effectware<T> = (ev: T) => void;

type Machineware<T> = {
  transition: Middleware<T>;
  begin: Middleware<T>;
  guard: Middleware<T>; // require completion of all guards
  before: Middleware<T>;
  handle: Middleware<T>;
  update: Middleware<T>;
  effect: Effectware<T>;
  exit: Effectware<T>;
  enter: Effectware<T>;
  after: Effectware<T>;
  notify: Effectware<T>;
  end: Effectware<T>;
} 

// type Targetware<M,E> = {
//   [K in keyof M]: WaresFor<M[K],E>;
// }
// type M = AnyStateMachinery

// type WaresFor<T, E> = 
//   T extends (event: E) => E ? Middleware<E> : 
//   T extends (event: E) => void ?  Effectware<E> :
//   never;  

// type X2 = WaresFor<(ev: number) => number, number>

// type X = Targetware<AnyStateMachinery,ReturnType<AnyStateMachinery['getChange']>>


// type Y = WaresFor<(ev: number) => void, number>

export const filter = <T>(fn: (value: T) => boolean): Middleware<T> => {
  return (target: T, next) => {
    if (fn(target)) next(target);
  }
}

const PHASES = '_phase';

export function middlewareSetup <E extends ChangeCommandEvent>(enhancers: HookConfig<{
  transition: Middleware<E>,
  begin: Middleware<E>,
  guard: Middleware<E>, // require completion of all guards
  before: Middleware<E>,
  handle: Middleware<E>,
  update: Middleware<E>,
}>) {
  return phaseSetup<E>(enhancers)
}

type HookConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

function phaseSetup<E extends ChangeCommandEvent>(
  record: HookConfig<Machineware<E>>,
) {
  return (target: StateMachinery<E>) => {
    const onPhase = phased<E>(target);
    return disposers(
      ...Object.keys(record).map((key) => {
        const listener = record[key];
        if (!listener) return () => {};
        return Array.isArray(listener)
          ? disposers(
              ...listener.map((listener) =>
                onPhase(key as PhaseKeys, listener),
              ),
            )
          : onPhase(key as PhaseKeys, listener);
      }),
    );
  };
}

// function listenware() {}

// function 

export function listenerSetup <E extends ChangeCommandEvent>(
  listeners: HookConfig<{
    effect: Effectware<E>,
    exit: Effectware<E>,
    enter: Effectware<E>,
    after: Effectware<E>,
    notify: Effectware<E>,
    end: Effectware<E>,
  }>
) {
  return phaseSetup<E>(listeners)

}

type PhaseTarget<E, MiddlewareKeys extends string, EffectKeys extends string> = {
  [K in MiddlewareKeys]: (ev: E) => E;
} & {
  [K in EffectKeys]: (ev: E) => void;
}

function phases<MiddlewareKeys extends string, EffectKeys extends string>(
  middlewareKeys: MiddlewareKeys[],
  effectKeys: EffectKeys[],
){
  return <T extends PhaseTarget<E, MiddlewareKeys, EffectKeys>, E>(target: T) => {
    return registrar<Middleware<E> | Effectware<E>, PhaseKeys, T>(
      target,
      function initRegistrar(record) {
        return disposers(
          ...middlewareKeys.map((key: any) => {
            return methodExtend(target, key, (inner) => {
              return ((...params: Parameters<typeof inner>) => {
                // run in middleware
                let result = undefined as ReturnType<typeof inner>;
                runMiddleware(
                  getRegistrants<Middleware<E>, typeof PHASES, T>(
                    target,
                    PHASES,
                    key,
                  ),
                  result as any,
                  (...params) => {
                    result = inner(...params);
                  },
                );
                return result;
              }) as typeof inner;
            });
          }),
          ...effectKeys.map((key: any) => {
            return methodExtend(target, key, (inner) => {
              return ((...params: Parameters<typeof inner>) => {
                inner(...params);
                runEffects(
                  getRegistrants<Effectware<E>, typeof PHASES, T>(
                    target,
                    PHASES,
                    key,
                  ),
                  params,
                );
              }) as typeof inner;
            });
          }),
        );
      },
    );
  }
}

function phased<
  E extends ChangeCommandEvent,
  T extends StateMachinery<E> = StateMachinery<E>,
>(target: T) {
  return registrar<Middleware<E> | Effectware<E>, PhaseKeys, T>(
    target,
    function initRegistrar(record) {
      return disposers(
        ...MiddlewareKeys.map((key: any) => {
          return methodExtend(target, key, (inner) => {
            return ((...params: Parameters<typeof inner>) => {
              // run in middleware
              let result = undefined as ReturnType<typeof inner>;
              runMiddleware(
                getRegistrants<Middleware<E>, typeof PHASES, T>(
                  target,
                  PHASES,
                  key,
                ),
                result,
                (...params) => {
                  result = inner(...params);
                },
              );
              return result;
            }) as typeof inner;
          });
        }),
        ...EffectKeys.map((key: any) => {
          return methodExtend(target, key, (inner) => {
            return ((...params: Parameters<typeof inner>) => {
              inner(...params);
              runEffects(
                getRegistrants<Effectware<E>, typeof PHASES, T>(
                  target,
                  PHASES,
                  key,
                ),
                params,
              );
            }) as typeof inner;
          });
        }),
      );
    },
  );
}
