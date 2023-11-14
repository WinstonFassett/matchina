export type ExitListener<E> = (event: E) => void;
export type EntryListener<E> = (event: E) => void | ExitListener<E>;

export const listen =
  <E>(entryListener: EntryListener<E>) =>
  (event: E, next: (event: E) => void) => {
    const exitListener = entryListener(event);
    next(event);
    exitListener?.(event);
  };
