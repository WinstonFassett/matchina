export type Middleware<E> = (event: E, next: (event?: E) => void) => void;

export function composeMiddleware<E>(
  ...middlewares: Middleware<E>[]
): Middleware<E> {
  // console.log(`run (compose) ${middlewares.length} middlewares`)
  return (initialEvent: E, finalNext: (event: E) => void) => {
    console.log(`run ${middlewares.length} middlewares`)
    function next(index: number, event: E): void {
      if (index >= middlewares.length) {
        finalNext(event);
        console.log('done')
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
