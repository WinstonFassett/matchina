export type Middleware<E> = (event: E, next: (event?: E) => void) => void;

export function composeMiddleware<E>(
  ...middlewares: Middleware<E>[]
): Middleware<E> {
  return (initialEvent: E, finalNext: (event: E) => void) => {
    function next(index: number, event: E): void {
      if (index >= middlewares.length) {
        finalNext(event);
        return;
      }
      middlewares[index](event, (nextEvent) => {
        next(index + 1, nextEvent === undefined ? event : nextEvent);
      });
    }
    next(0, initialEvent);
  };
}

export function runMiddleware<E>(
  middlewares: Middleware<E>[],
  initialValue: E,
  finalCallback: (finalValue?: E) => void,
): void {
  composeMiddleware(...middlewares)(initialValue, finalCallback);
}
