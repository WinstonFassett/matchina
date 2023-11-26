import { Middleware, runMiddleware } from "../../extras/middleware";
import { methodExtend } from "./method";
import { getRegistrants, registrar, runEffects } from "./registrants";
import { disposers } from "./setup";
import { StateMachinery } from "./state-machine";
import { ChangeCommandEvent } from "./types";


const EffectKeys = ['effect', 'enter', 'exit', 'notify'] as const;
type EffectKeys = typeof EffectKeys[number]

const MiddlewareKeys = ['begin', 'guard', 'before', 'handle', 'update', 'end'] as const;
type MiddlewareKeys = typeof MiddlewareKeys[number]

const PhaseKeys = [...MiddlewareKeys, ...EffectKeys]
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

export const filter = <T>(fn: (value: T) => boolean): Middleware<T> => {
  return (target: T, next) => {
    if (fn(target)) next(target);
  }
}

const PHASES = '_phase';

export function enhance <E extends ChangeCommandEvent>(enhancers: HookConfig<{
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

export function listen <E extends ChangeCommandEvent>(
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
