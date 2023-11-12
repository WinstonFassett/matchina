export {};

// First, we need to define types for our argument and return types
type Fn<T extends any[], R> = (...args: T) => R;

type Middleware<T extends any[], R> = (fn: Fn<T, R>) => Fn<T, R>;

export function applyMiddleware<T extends any[], R>(
  targetFunction: Fn<T, R>,
  ...middlewares: Middleware<T, R>[]
): Fn<T, R>;

export async function applyMiddleware<T extends any[], R>(
  targetFunction: Fn<T, R>,
  ...middlewares: Middleware<T, R>[]
): Promise<Fn<T, R>>;

export function applyMiddleware<T extends any[], R>(
  targetFunction: Fn<T, R>,
  ...middlewares: Middleware<T, R>[]
): Fn<T, R> | Promise<Fn<T, R>> {
  let currentFn: Fn<T, R> | Promise<Fn<T, R>> = targetFunction;

  for (const middleware of middlewares) {
    currentFn = middleware(currentFn);
  }

  return currentFn;
}
