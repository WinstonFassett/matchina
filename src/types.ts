export type TransitionRecord<T = any> = Record<string, Record<string, T>>;

export interface TransitionContext {
  transitions: TransitionRecord;
}
export type Guard<E> = (ev: E) => boolean;
export type Effect<E> = (ev: E) => void;
export type Handle<E> = (ev: E) => E | undefined;

export type Middleware<E> = (event: E, next: (event: E) => void) => void;
