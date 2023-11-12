// import { Func } from "../types";

type Func<T extends any[], R> = (...args: T) => R;

export type Middleware<T extends any[], R> = (fn: Func<T, R>) => Func<T, R>;

// Define a Middleware type
// export type Middleware<T extends any[], R> = (fn: (...args: T) => R) => (...args: T) => R;

export function applyMiddleware<T extends any[], R, M extends R>(
  targetFunction: Func<T, R>,
  ...middlewares: Middleware<T, M>[]
): Func<T, R>;

export async function applyMiddleware<T extends any[], R,  M extends R>(
  targetFunction: Func<T, R>,
  ...middlewares: Middleware<T, M>[]
): Promise<Func<T, R>>;

export function applyMiddleware<T extends any[], R,  M extends R>(
  targetFunction: Func<T, R>,
  ...middlewares: Middleware<T, R>[]
): Func<T, R> | Promise<Func<T, R>> {
  let currentFn: Func<T, R> | Promise<Func<T, R>> = targetFunction;

  for (const middleware of middlewares) {
    currentFn = middleware(currentFn);
  }

  return currentFn;
}
