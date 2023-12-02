import { Func } from "../v1/types";

export {};

export type Middleware<F extends Func> = (fn: F) => F;

export function applyMiddleware<F extends Func>(
  targetFunction: F,
  ...middlewares: Middleware<F>[]
): F {
  return middlewares.reduceRight(
    (composed, middleware) => middleware(composed),
    targetFunction,
  );
}

export function applyMethodware<
  T extends Record<K, (...args: any[]) => any>,
  K extends keyof T,
>(subject: T, key: K, ...middlewares: Middleware<T[K]>[]) {
  const inner = subject[key];
  subject[key] = applyMiddleware(inner, ...middlewares);
  return () => {
    subject[key] = inner;
  };
}

function loggerMiddleware<F extends Func>(
  fn: F,
): (...args: Parameters<F>) => ReturnType<F> {
  return (...args: Parameters<F>): ReturnType<F> => {
    const startTime = Date.now();
    console.log(
      `[${new Date(
        startTime,
      ).toLocaleTimeString()}] Calling the target function with args:`,
      args,
    );
    const result = fn(...args);
    const endTime = Date.now();
    console.log(
      `[${new Date(
        endTime,
      ).toLocaleTimeString()}] Target function finished execution. Return value:`,
      result,
    );
    return result;
  };
}

// Example target function
function add(a: number, b: number): number {
  return a + b;
}

// Usage
const enhancedFunction = applyMiddleware(add, loggerMiddleware);

const result = enhancedFunction(2, 3); // This will run the middleware chain and the target function
console.log(`Result:`, result);
