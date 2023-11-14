export type Middleware<T> = (
  context: T,
  next: () => Promise<void>,
) => Promise<void>;
