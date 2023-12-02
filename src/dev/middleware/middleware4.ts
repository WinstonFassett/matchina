type Func<T extends any[], R> = (...args: T) => R;

export type Middleware<T extends any[], R> = (fn: Func<T, R>) => Func<T, R>;

export function applyMiddleware<T extends any[], R, M extends R>(
  targetFunction: Func<T, R>,
  ...middlewares: Middleware<T, M>[]
): Func<T, R>;

export async function applyMiddleware<T extends any[], R, M extends R>(
  targetFunction: Func<T, R>,
  ...middlewares: Middleware<T, M>[]
): Promise<Func<T, R>>;

export function applyMiddleware<T extends any[], R, M extends R>(
  targetFunction: Func<T, R>,
  ...middlewares: Middleware<T, R>[]
): Func<T, R> | Promise<Func<T, R>> {
  let currentFn: Func<T, R> | Promise<Func<T, R>> = targetFunction;
  for (const middleware of middlewares) {
    currentFn = middleware(currentFn);
  }
  return currentFn;
}

export function applyMethodware<
  T extends Record<K, (...args: any[]) => any>,
  K extends keyof T,
>(
  subject: T,
  key: K,
  ...middlewares: Middleware<Parameters<T[K]>, ReturnType<T[K]>>[]
) {
  const inner = subject[key];
  const composed = (applyMiddleware as any)(inner, ...middlewares);
  subject[key] = composed;
  return () => {
    subject[key] = inner;
  };
}
