import { Disposer, Setup } from "../function-types";

/**
 * Returns a disposer function that runs an array of cleanup functions in reverse order.
 * Useful for teardown logic where order matters.
 * @param fns - Array of disposer functions
 * @returns A function that disposes all provided functions in reverse order
 */
export const createDisposer = (fns: Disposer[]) => () => {
  for (let i = fns.length - 1; i >= 0; i--) {
    fns[i]();
  }
};

/**
 * @function
 * Composes multiple setup functions into a single setup.
 * Each setup receives the target and returns a disposer; all disposers are run in reverse order.
 * @param setups - Setup functions to compose
 * @returns A setup function
 */
export const createSetup: <T>(...setups: Setup<T>[]) => Setup<T> =
  (...setups) =>
  (target) =>
    createDisposer(setups.map((fn) => fn(target)));

/**
 * Returns a function that applies multiple setups to a target and returns a disposer for all.
 * @param target - The setup target
 * @returns Function accepting setups, returning a disposer
 */
export const setup =
  <T>(target: T): ((...setups: Setup<T>[]) => Disposer) =>
  (...setups: Setup<T>[]) =>
    createDisposer(setups.map((fn) => fn(target)));

/**
 * Builder for setup/disposer logic. Allows incremental addition of setups and returns a tuple:
 * [add, dispose].
 * - add: function to add setups and get a disposer for them
 * - dispose: function to dispose all setups added so far
 * @param target - The setup target
 * @returns [add, dispose] tuple
 */
export const buildSetup = <T>(target: T) => {
  const d: Disposer[] = [];
  const add = (...setups: Setup<T>[]) => {
    d.push(...setups.map((fn) => fn(target)));
    return () => {
      for (let i = d.length - 1; i >= 0; i--) {
        d[i]();
      }
    };
  };
  return [add, () => createDisposer(d)()];
};
