export type Disposer = () => void;
export type Setup<T> = (target: T) => Disposer;

/**
 * Run cleanup functions in reverse order
 * @param fns
 * @returns
 */
export function disposers(fns: Disposer[]) {
  return () => {
    for (let i = fns.length - 1; i >= 0; i--) {
      fns[i]();
    }
  };
} // #endregion

export function createSetup<T>(...setups: Setup<T>[]): Setup<T> {
  return function applySetup(target: T) {
    return disposers(setups.map((fn) => fn(target)));
  };
}

export function setup<T>(target: T): (...setups: Setup<T>[]) => Disposer {
  return function (...setups: Setup<T>[]) {
    return disposers(setups.map((fn) => fn(target)));
  };
}
