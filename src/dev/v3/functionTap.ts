import { Middleware } from "../v1/middleware";
import { Func } from "../v1/types";
import { HasMethod, Funcware, MethodOf } from "./method";


export function functionTap<K extends string, T extends HasMethod<K>>(fn: T[K]): Funcware<MethodOf<HasMethod<K>, K>> {
  return inner => (...params) => {
    const res = inner(...params);
    fn(...params);
    return res;
  };
}

export function composeFuncware<F extends (...params: any[]) => any>(
  fns: Funcware<F>[]
): Funcware<F> {
  // return (inner) => fns.reduce((acc, fn) => fn(acc), inner);  
  // return inner => fns.reduceRight((next, fn) => fn(next), inner);
  return (inner) => {
    function next(index: number, ...params: Parameters<F>): ReturnType<F> {
      if (index === fns.length) return inner(...params);
      return fns[index](next.bind(null, index + 1))(...params);
    }
    return next.bind(null, 0);
  };
}

export function extendFunction<F extends (...params: any[]) => any>(
  inner: F,
  fns: Funcware<F>[]
): F {
  return composeFuncware(fns)(inner) as F;
}

export function functionExtender<F extends (...params: any[]) => any>(
  fns: Funcware<F>[]
): Funcware<F> {
  return (inner) => extendFunction(inner, fns);
}
type FuncMiddleware<F extends (...args: any) => any> = Middleware<[params: Parameters<F>, result: ReturnType<F>]>;
const VOID = {};
function funcwareFromMiddleware<E>(
  middleware: Middleware<E>
): Funcware<Func<E, any>> {
  return (inner) => (ev) => {
    let result = VOID as E;
    middleware(ev, (ev) => {
      result = inner(ev);
    });
    if (result !== VOID) return result;
  };
}
function middlewareFromFuncware<E, P extends any[], R>(
  fw: Funcware<Func<[...P], R>>
): Middleware<[params: P, result: R]> {
  return ([params, _], next) => {
    return fw(([...args]) => {
      const invocation = [args, undefined as R] as [P, R];
      next([args, invocation[1]]);
      return invocation[1];
    })([...params]);
  };
}
