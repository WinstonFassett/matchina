export type ExitListener<E> = (event: E) => void;
export type EntryListener<E> = (event: E) => void | ExitListener<E>;

export function condition<E>(
  test: (ev: E) => boolean,
  entryListener: EntryListener<E>,
) {
  let exitListener: void | ((ev: E) => void);
  return (ev: E) => {
    if (test(ev)) {
      exitListener = entryListener(ev);
    } else {
      exitListener?.(ev);
      exitListener = undefined;
    }
  };
}
