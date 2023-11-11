export {};

export type Middleware<A extends any[], R> = (
  fn: (...args: A) => R,
) => (...args: A) => R;

export function applyMiddleware<A extends any[], R>(
  targetFunction: (...args: A) => R,
  ...middlewares: Middleware<A, R>[]
): (...args: A) => R {
  return middlewares.reduceRight(
    (composed, middleware) => middleware(composed),
    targetFunction,
  );
}

export function applyMethodware<
  T extends { [key: string]: (...args: any[])=> any}, 
  K extends keyof T,
>(
  subject: T, key: K,
  ...middlewares: Middleware<Parameters<T[K]>, ReturnType<T[K]>>[]
): (...args: Parameters<T[K]>) => ReturnType<T[K]> {  
  return applyMiddleware(subject[key], ...middlewares);
}

// Example middleware functions
function loggerMiddleware<A extends any[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  return (...args: A) => {
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
