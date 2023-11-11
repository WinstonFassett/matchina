type Context<T, E> = {
  event: E;
  from: T;
  to?: T;
};

type Middleware<T, E> = (context: Context<T, E>, next: () => void) => void;

function applyMiddleware<T, E>(
  baseFunction: (from: T, event: E) => T,
  middlewares: Middleware<T, E>[],
): (from: T, event: E) => T {
  return (from: T, event: E): T => {
    const context: Context<T, E> = { event, from };
    let index = 0;
    let called = false; // To prevent multiple next() calls

    const proceed = () => {
      called = false;
      next();
    };

    const next = () => {
      if (called) {
        throw new Error("next() called multiple times by a middleware");
      }
      called = true;

      const mw = middlewares[index++];
      if (mw) {
        mw(context, proceed);
      } else {
        context.to = baseFunction(from, event);
      }
    };

    next();
    return context.to!;
  };
}
