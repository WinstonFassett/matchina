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
const loggerMiddleware: Middleware<any[], any> = (next) => async (...args) => {
  const startTime = Date.now();
  console.log(`[${new Date(startTime).toLocaleTimeString()}] Calling the target function with args:`, args);
  const result = await next(...args);
  const endTime = Date.now();
  console.log(`[${new Date(endTime).toLocaleTimeString()}] Target function finished execution. Return value:`, result);
  return result;
};

const authorizationMiddleware: Middleware<any[], any> = (next) => async (...args) => {
  // Perform authorization logic here
  const isAuthenticated = true; // For demonstration purposes
  if (isAuthenticated) {
    return await next(...args);
  } else {
    console.log(`Unauthorized`);
  }
};

// Example target function
const myFunction: (...args: any[]) => Promise<number> = async (...args) => {
  console.log(`Executing the target function with args:`, args);
  // Simulate some asynchronous work
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return 42;
};

// Usage
const enhancedFunction = applyMiddleware(myFunction, loggerMiddleware, authorizationMiddleware);

enhancedFunction(1, 'example').then((result) => {
  console.log(`Result:`, result);
});
