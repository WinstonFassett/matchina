export {};

// First, we need to define types for our argument and return types
type Fn<T extends any[], R> = (...args: T) => R;

type Middleware<T extends any[], R> = (fn: Fn<T, R>) => Fn<T, R>;

function applyMiddleware<T extends any[], R>(
  targetFunction: Fn<T, R>,
  ...middlewares: Middleware<T, R>[]
): Fn<T, R>;

async function applyMiddleware<T extends any[], R>(
  targetFunction: Fn<T, R>,
  ...middlewares: Middleware<T, R>[]
): Promise<Fn<T, R>>;

function applyMiddleware<T extends any[], R>(
  targetFunction: Fn<T, R>,
  ...middlewares: Middleware<T, R>[]
): Fn<T, R> | Promise<Fn<T, R>> {
  let currentFn: Fn<T, R> = targetFunction;

  for (const middleware of middlewares) {
    currentFn = middleware(currentFn);
  }

  return currentFn;
}

// loggerMiddleware
const loggerMiddleware: Middleware<any[], any> = (next) => async (...args: any[]) => {
  console.log('Before:', args);
  const result = await next(...args);
  console.log('After:', result);
  return result;
};

// Example with synchronous function
let syncSum = (a: number, b: number): number => a + b;
syncSum = applyMiddleware(syncSum, loggerMiddleware);

// Example with asynchronous function
let asyncSum = async (a: number, b: number): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(a + b), 1000);
  });
};
asyncSum = await applyMiddleware(asyncSum, loggerMiddleware);

(async () => {
  console.log(await syncSum(1, 2)); // Logs: "Before: [1, 2]", "After: 3", Output: 3
  console.log(await asyncSum(3, 4)); // Logs: "Before: [3, 4]", "After: 7", Output: 7 (after 1 second delay)
})();
