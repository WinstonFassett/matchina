export {};
type Middleware<T> = (context: T, next: () => void) => void;

function applyMiddleware<T>(
  targetFunction: (context: T) => void,
  ...middlewares: Middleware<T>[]
) {
  return (context: T) => {
    let index = 0;
    function next() {
      if (index < middlewares.length) {
        const currentMiddleware = middlewares[index];
        index++;
        currentMiddleware(context, next);
      } else {
        // All middlewares have been executed, call the target function
        targetFunction(context);
      }
    }
    next(); // Start the middleware chain
  };
}

// Example middleware functions
function loggerMiddleware<T>(context: T, next: () => void) {
  const startTime = Date.now();
  const args = JSON.stringify(context);
  console.log(
    `[${new Date(
      startTime,
    ).toLocaleTimeString()}] Calling the target function with args:`,
    args,
  );
  next();
  const endTime = Date.now();
  console.log(
    `[${new Date(
      endTime,
    ).toLocaleTimeString()}] Target function finished execution. Return value:`,
    JSON.stringify(context),
  );
}

function authorizationMiddleware<T extends { isAuthenticated: boolean }>(
  context: T,
  next: () => void,
) {
  // Perform authorization logic here
  if (context.isAuthenticated) {
    next(); // Authorized, proceed to the next middleware or target function
  } else {
    console.log(`Unauthorized`);
  }
}

// Example target function
function myFunction(context: { isAuthenticated: boolean }) {
  console.log(`Executing the target function`);
  // Simulate some work
  context.isAuthenticated = true; // Modify the context for demonstration
}

// Usage
const enhancedFunction = applyMiddleware(
  myFunction,
  loggerMiddleware,
  authorizationMiddleware,
);

enhancedFunction({ isAuthenticated: false }); // This will run the middleware chain and the target function
