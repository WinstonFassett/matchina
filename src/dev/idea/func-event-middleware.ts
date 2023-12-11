import { Middleware } from "../../types";
import { Func } from "../../utility-types";
import { Funcware, HasMethod, MethodOf } from "../../ext/types";

export type FuncEventMiddleware<F extends (...params: any[]) => any> =
  Middleware<FuncEvent<F>>;

type FuncEvent<F extends Func> = [args: Parameters<F>, result: ReturnType<F>];

export function methodMiddleware<T, K extends keyof T>(
  target: T,
  methodName: K,
  mw: FuncEventMiddleware<MethodOf<T, K>>,
) {
  const original = target[methodName] as MethodOf<T, K>;
  const next = original.bind(target);
  target[methodName] = ((...params: Parameters<MethodOf<T, K>>) => {
    let result = undefined as undefined | ReturnType<MethodOf<T, K>>;
    mw([params, undefined as any], (ev) => (result = ev[1]));
    return result ?? next(...params);
  }) as T[K];
  return () => {
    target[methodName] = original;
  };
}

export function effectware<K extends string, T extends HasMethod<K>>(
  fn: T[K],
): FuncEventMiddleware<MethodOf<T, K>> {
  return (ev, next) => {
    console.log("run effectware", ev, next);
    next(ev);
    fn(ev);
  };
}

export const methodEffect =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) =>
  (target: T) => {
    return methodMiddleware(target, methodName, effectware<K, T>(fn));
  };

export const iff = <F extends (...params: any[]) => any>(
  test: (ev: FuncEvent<F>) => boolean | void,
  ware: FuncEventMiddleware<F>,
) => {
  return (ev: FuncEvent<F>, inner: F) => (ev: FuncEvent<F>) => {
    if (test(ev)) {
      return ware(ev, inner);
    }
    return inner(ev);
  };
};

export const methodHook =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: FuncEventMiddleware<MethodOf<T, K>>) =>
  (target: T) => {
    return methodMiddleware(target, methodName, fn);
  };

export const methodEventHook =
  <K extends string>(methodName: K) =>
  <
    T extends HasMethod<K>,
    E extends Parameters<MethodOf<T, K>>[0] = Parameters<MethodOf<T, K>>[0],
  >(
    mw: Middleware<E>,
  ) =>
  (target: T) => {
    return methodMiddleware(target, methodName, (funcEvent, next) => {
      mw(funcEvent[0][0], (ev) => {
        next([funcEvent[0], ev] as FuncEvent<MethodOf<T, K>>);
      });
    });
  };

export const toEnhancer =
  <F extends Func>(mw: FuncEventMiddleware<F>): Funcware<F> =>
  (fn: F) =>
    ((...args) => {
      let result = undefined as undefined | ReturnType<F>;
      mw([args, undefined] as FuncEvent<F>, (ev) => (result = ev[1]));
      return result;
    }) as F;

export const fromEnhancer =
  <F extends Func>(enhancer: Funcware<F>) =>
  (ev: FuncEvent<F>) =>
    enhancer(ev[1])(...ev[0]);
