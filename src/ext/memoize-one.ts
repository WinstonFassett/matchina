export function memoizeOne<F extends (...args: any[]) => any>(fn: F): F {
  let lastArgs: any[] | null = null;
  let lastResult: any;
  return function (...args: any[]) {
    if (
      lastArgs &&
      args.length === lastArgs.length &&
      args.every((v, i) => Object.is(v, lastArgs![i]))
    ) {
      return lastResult;
    }
    lastArgs = args;
    lastResult = fn(...args);
    return lastResult;
  } as F;
}
