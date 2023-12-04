import { Funcware } from "../types";

export function composeFuncware<F extends (...params: any[]) => any>(
  fns: Funcware<F>[],
): Funcware<F> {
  // return (inner) => fns.reduce((acc, fn) => fn(acc), inner);
  // return inner => fns.reduceRight((next, fn) => fn(next), inner);
  return (inner) => {
    function next(index: number, ...params: Parameters<F>): ReturnType<F> {
      if (index === fns.length) return inner(...params);
      return fns[index](next.bind(null, index + 1) as F)(...params);
    }
    return next.bind(null, 0) as F;
  };
}
