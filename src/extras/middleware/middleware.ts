export {}


type Middleware<A extends any[], R> = (
  next: (...args: A) => Promise<R> | R
) => (...args: A) => Promise<R>;

function applyMiddleware<A extends any[], R>(
  targetFunction: (...args: A) => Promise<R> | R,
  ...middlewares: Middleware<A, R>[]
): (...args: A) => Promise<R> {
    return async (...args: A) => {
      const asyncTargetFunction = async () => {
        return await Promise.resolve(targetFunction(...args));
      };

      return middlewares.reduceRight(
        (composed, middleware) => {
          return middleware(composed);
        },
        asyncTargetFunction
      )();
    };
  }
  

// Example middleware functions
function timingMiddleware<A extends any[], R>(
  next: (...args: A) => Promise<R> | R
): (...args: A) => Promise<R> {
  return async (...args: A) => {
    const startTime = Date.now();
    const result = await next(...args);
    const endTime = Date.now();
    console.log(`Execution time: ${endTime - startTime}ms`);
    return result;
  };
}

function errorHandlingMiddleware<A extends any[], R>(
  next: (...args: A) => Promise<R> | R
): (...args: A) => Promise<R> {
  return async (...args: A) => {
    try {
      const result = await next(...args);
      return result;
    } catch (error) {
      console.error(`Error: ${error}`);
      throw error;
    }
  };
}

// Example target function
async function asyncAdd(a: number, b: number): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(a + b);
    }, 1000);
  });
}

function syncMultiply(x: number, y: number): number {
  return x * y;
}

// Usage with async function
const asyncEnhancedFunction = applyMiddleware(asyncAdd, timingMiddleware, errorHandlingMiddleware);
asyncEnhancedFunction(2, 3).then((result) => {
  console.log(`Result (Async):`, result);
});

// Usage with sync function
const syncEnhancedFunction = applyMiddleware(syncMultiply, timingMiddleware, errorHandlingMiddleware);
const syncResult = syncEnhancedFunction(2, 3);
console.log(`Result (Sync):`, syncResult);
