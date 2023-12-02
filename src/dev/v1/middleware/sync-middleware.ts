type SyncMiddleware<T> = (value: T) => T;

function pipeValue<T>(middlewares: SyncMiddleware<T>[], value: T): T {
  for (const middleware of middlewares) {
    value = middleware(value);
  }
  return value;
}

type SyncOptionalReturnMiddleware<T> = (value?: T) => T | undefined;

function runSyncOptionalMiddlewares<T>(
  middlewares: SyncOptionalReturnMiddleware<T>[],
  value?: T,
): T | undefined {
  for (const middleware of middlewares) {
    value = middleware(value) ?? value;
  }
  return value;
}

function runSyncStoppableMiddlewares<T>(
  middlewares: SyncOptionalReturnMiddleware<T>[],
  value?: T,
): T | undefined {
  for (const middleware of middlewares) {
    if (value === undefined) {
      return value;
    }
    value = middleware(value);
  }
  return value;
}
