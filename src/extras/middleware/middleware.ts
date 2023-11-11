export {}

type Middleware<A extends any[], R> = (
  fn: (...args: A) => Promise<R> | R
) => (...args: A) => Promise<R>;

function applyMiddleware<A extends any[], R>(
  targetFunction: (...args: A) => Promise<R> | R,
  ...middlewares: Middleware<A, R>[]
): (...args: A) => Promise<R> {
  return async (...args: A) => {
    const context = { args };
    let index = -1;

    async function next(): Promise<R> {
      index++;
      if (index < middlewares.length) {
        const currentMiddleware = middlewares[index];
        return await currentMiddleware(next)(...args);
      } else {
        return await targetFunction(...args);
      }
    }

    return await next();
  };
}

// Example middleware functions
const authenticationMiddleware: Middleware<any[], any> = (next) => async (...args) => {
  // Perform authentication logic here
  const isAuthenticated = true; // For demonstration purposes
  if (isAuthenticated) {
    return await next(...args);
  } else {
    console.log(`Unauthorized`);
  }
};

const loggerMiddleware: Middleware<any[], any> = (next) => async (...args) => {
  const startTime = Date.now();
  console.log(`[${new Date(startTime).toLocaleTimeString()}] Calling the target function with args:`, args);
  const result = await next(...args);
  const endTime = Date.now();
  console.log(`[${new Date(endTime).toLocaleTimeString()}] Target function finished execution. Return value:`, result);
  return result;
};

const timingMiddleware: Middleware<any[], any> = (next) => async (...args) => {
  const startTime = Date.now();
  const result = await next(...args);
  const endTime = Date.now();
  console.log(`Execution time: ${endTime - startTime}ms`);
  return result;
};

const errorHandlingMiddleware: Middleware<any[], any> = (next) => async (...args) => {
  try {
    return await next(...args);
  } catch (error) {
    console.error(`Error: ${error}`);
    throw error;
  }
};

const throttleMiddleware = (delay: number): Middleware<any[], any> => (next) => async (...args) => {
  let isThrottled = false;
  if (!isThrottled) {
    isThrottled = true;
    setTimeout(() => {
      isThrottled = false;
    }, delay);
    return await next(...args);
  } else {
    console.log(`Function throttled. Skipping execution.`);
  }
};

const debounceMiddleware = (delay: number): Middleware<any[], any> => (next) => async (...args) => {
  let timeout: NodeJS.Timeout | null = null;
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(async () => {
    timeout = null;
    return await next(...args);
  }, delay);
};


// Middleware for subscribe pattern
const subscribeMiddleware = <A extends any[], R>(
  subscribeCallback: (...args: A) => ((result: R) => void) | undefined
): Middleware<A, R> => (next) => async (...args) => {
  // Get the resultCallback from subscribeCallback
  const resultCallback = subscribeCallback(...args);

  // Execute the target function
  const result = await next(...args);

  // Call the resultCallback if provided with the result
  resultCallback?.(result);

  // Return the result
  return result;
};


// Example target function
const myFunction: (...args: any[]) => Promise<number> = async (...args) => {
  console.log(`Executing the target function with args:`, args);
  // Simulate some asynchronous work
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return 42;
};

// Usage
const middlewareArray = [
  authenticationMiddleware,
  loggerMiddleware,
  timingMiddleware,
  errorHandlingMiddleware,
  throttleMiddleware(1000),
  debounceMiddleware(1000),
];

const enhancedFunction = applyMiddleware(myFunction, ...middlewareArray);

enhancedFunction(1, 'example').then((result) => {
  console.log(`Result:`, result);
});
