import { Middleware } from "../../types";

function interleaveMiddleware<E>(
  middlewares: Middleware<E>[],
  customBehavior: (
    event: E,
    next: (event: E) => void,
    currentWareInfo: { index: number },
  ) => void,
): Middleware<E> {
  return (initialEvent: E, finalNext: (event: E) => void) => {
    function next(index: number, event: E, nextCallback: (event: E) => void) {
      if (index >= middlewares.length) {
        finalNext(event);
        return;
      }

      const currentMiddleware = middlewares[index];
      const currentWareInfo = { index };

      currentMiddleware(event, (nextEvent) => {
        customBehavior(nextEvent as E, nextCallback, currentWareInfo);
        next(
          index + 1,
          nextEvent === undefined ? event : nextEvent,
          nextCallback,
        );
      });
    }

    next(0, initialEvent, finalNext);
  };
}

// Example usage (unchanged from previous example):
const middleware1: Middleware<number> = (event, next) => {
  console.log("Middleware 1", event);
  next(event + 1);
};

const middleware2: Middleware<number> = (event, next) => {
  console.log("Middleware 2", event);
  next(event + 1);
};

const middleware3: Middleware<number> = (event, next) => {
  console.log("Middleware 3", event);
  next(event + 1);
};

const lotsOfWares: Middleware<number>[] = [
  middleware1,
  middleware2,
  middleware3,
];

const customBehavior = (
  event: number,
  next: (event: number) => void,
  currentWareInfo: { index: number },
) => {
  console.log(`Before Middleware ${currentWareInfo.index}`);
  next(event);
  console.log(`After Middleware ${currentWareInfo.index}`);
};

const instrumentedVersion = interleaveMiddleware(lotsOfWares, customBehavior);

instrumentedVersion(0, (finalResult) => {
  console.log("Final Result:", finalResult);
});
