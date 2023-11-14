export type Middleware<E> = (event: E, next: (event?: E) => void) => void;
