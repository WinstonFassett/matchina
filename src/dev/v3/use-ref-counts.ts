import { Disposer } from "./registrants";

/**
 *
 * @param target - n/a
 * @param record to use for ref counts
 * @returns use(key, fn) => [value, unuse]
 */
const useRefCounts = <T, R>(record: Record<string, [count: number, value: R, dispose: Disposer]> = {}) => {
  return [useKey, disposeAll];
  function useKey<K extends string>(key: K, fn: (key: K) => [R, Disposer]) {
    if (record[key]) {
      record[key][0]++;
    } else {
      record[key] = [1, ...fn(key)];
    }
    return [
      record[key][1],
      function unuse() {
        record[key][0]--;
        if (record[key][0] === 0) {
          const cleanup = record[key][2];
          delete record[key];
          cleanup();
        }
      }
    ];
  }
  function disposeAll() {
    Object.keys(record).forEach(key => {
      record[key][2]();
    });
  }
};
const x = {};
useRefCounts(x)[0]('someProperty', (key) => {
  const target = x;
  const orig = target[key];
  target[key] = 'some value';
  return [target[key], () => {
    target[key] = orig;
  }];
});
