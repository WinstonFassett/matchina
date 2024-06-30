export type Effect<E> = (ev: E) => void;

export type Middleware<E> = (event: E, next: (event: E) => void) => void;
