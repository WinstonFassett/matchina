export type ExitListener<E> = (event: E) => void;
export type EntryListener<E> = (event: E) => void | ExitListener<E>;

export function when<E>(test: (ev: E) => any, entryListener: EntryListener<E>) {
  let exitListener: void | ((ev: E) => void);
  return (ev: E) => {
    if (exitListener) {
      exitListener(ev);
      exitListener = undefined;
    }
    if (test(ev)) {
      exitListener = entryListener(ev);
    }
  };
}

const noop = () => {};
