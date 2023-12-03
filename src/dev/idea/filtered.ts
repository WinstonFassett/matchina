import { Func } from "../types";

export function filtered<P extends any[], R, F extends Func<P, R>>(
  fn: (...params: Parameters<F>) => boolean,
) {
  return (inner: F) =>
    (...params: Parameters<F>) => {
      if (fn(...params)) return inner(...params);
    };
}
