import { Disposer, Setup } from "./types";

/**
 * Run cleanup functions in reverse order
 * @param fns
 * @returns
 */
export const disposers = (fns: Disposer[]) => () => {
  for (let i = fns.length - 1; i >= 0; i--) {
    fns[i]();
  }
};

export const createSetup: <T>(...setups: Setup<T>[]) => Setup<T> =
  (...setups) =>
  (target) =>
    disposers(setups.map((fn) => fn(target)));

export const setup = <T>(target: T): ((...setups: Setup<T>[]) => Disposer) => 
 (...setups: Setup<T>[]) => 
    disposers(setups.map((fn) => fn(target)))
  
