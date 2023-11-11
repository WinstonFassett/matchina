export {}
import compose from 'koa-compose';

type Middleware<T> = (context: T, next: () => Promise<void>) => Promise<void>;

// Authentication Middleware
const authenticationMiddleware: Middleware<{ isAuthenticated: boolean }> = async (context, next) => {
  // Perform authentication logic here
  context.isAuthenticated = true; // For demonstration purposes
  await next(); // Continue to the next middleware or target function
};

// Logger Middleware
const loggerMiddleware: Middleware<any> = async (context, next) => {
  const startTime = Date.now();
  console.log(`[${new Date(startTime).toLocaleTimeString()}] Calling the target function with args:`, context);
  await next();
  const endTime = Date.now();
  console.log(`[${new Date(endTime).toLocaleTimeString()}] Target function finished execution.`);
};

// Timing Middleware
const timingMiddleware: Middleware<any> = async (context, next) => {
  const startTime = Date.now();
  await next();
  const endTime = Date.now();
  console.log(`Execution time: ${endTime - startTime}ms`);
};

// Error Handling Middleware
const errorHandlingMiddleware: Middleware<any> = async (context, next) => {
  try {
    await next();
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

// Throttle Middleware
const throttleMiddleware = (delay: number): Middleware<any> => {
  let isThrottled = false;
  return async (context, next) => {
    if (!isThrottled) {
      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, delay);
      await next();
    } else {
      console.log(`Function throttled. Skipping execution.`);
    }
  };
};

// Debounce Middleware
const debounceMiddleware = (delay: number): Middleware<any> => {
  let timeout: NodeJS.Timeout | null = null;
  return async (context, next) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(async () => {
      timeout = null;
      await next();
    }, delay);
  };
};

// Example target function
const targetFunction: Middleware<any> = async (context, next) => {
  console.log(`Executing the target function`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await next();
};

// Create composed middleware
const middlewareArray = [
  authenticationMiddleware,
  loggerMiddleware,
  timingMiddleware,
  errorHandlingMiddleware,
  throttleMiddleware(1000),
  debounceMiddleware(1000),
  targetFunction,
];
const composedMiddleware = compose(middlewareArray);

// Usage
const context = { isAuthenticated: false };
composedMiddleware(context, async () => {}).then(() => {
  console.log(`Middleware stack completed.`);
});
