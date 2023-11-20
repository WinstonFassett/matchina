import { StoreInternals } from "./machine-types-v2";

export const atom = <T>(initial: T): StoreInternals<T> => {
  let value = initial;
  return {
    get() {
      return value;
    },
    set(newValue: T) {
      value = newValue;
    },
  };
};
export const emptyEffect = <E>(event: E) => {};
