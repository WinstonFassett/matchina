// Define a Middleware type
export type Middleware<T extends any[], R> = (fn: (...args: T) => R) => (...args: T) => R;

// applyMiddleware function
export function applyMiddleware<T extends any[], R>(
  targetFunction: (...args: T) => R,
  ...middlewares: Middleware<T, R>[]
): (...args: T) => R {
  return middlewares.reduce((prev, middleware) => middleware(prev), targetFunction);
}
