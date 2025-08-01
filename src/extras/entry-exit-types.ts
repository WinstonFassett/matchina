export type ExitListener<E> = (event: E) => void;
export type EntryListener<E> = (event: E) => void | ExitListener<E>;
