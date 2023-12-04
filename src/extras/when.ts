import { EntryListener } from "./condition";


export const when = <E>(test: (ev: E) => boolean) => (entryListener: EntryListener<E>) => {
  let exitListener: void | ((ev: E) => void);
  return (ev: E) => {
    if (test(ev)) {
      exitListener = entryListener(ev);
    } else {
      exitListener?.(ev);
      exitListener = undefined;
    }
  };
};
