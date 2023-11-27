import { Disposer, registrar } from "./registrants";

/**
 *
 * @param target - n/a
 * @param record to use for ref counts
 * @returns use(key, fn) => [value, unuse]
 */
export const useRefCounts = <V>(
  record: Record<string, [count: number, value: V, dispose: Disposer]> = {},
) => {
  return useKey //[useKey, disposeAll];
  function useKey<K extends string, R extends V>(
    key: K,
    fn: (key: K) => [value: R, dispose: Disposer],
  ) {
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
      },
    ] as [value: R, unuse: () => void];
  }
  function disposeAll() {
    Object.keys(record).forEach((key) => {
      record[key][2]();
    });
  }
};
const x = {};
const [property, unsub] = useRefCounts(x)('someProperty', (key) => {
  const target = x;
  const orig = target[key];
  target[key] = 'some value';
  return [target[key], () => {
    target[key] = orig;
  }];
});

const REFS = '_refs'

export const useRefCountsOn = <T extends object>(target: T) => {
  target[REFS] ??= {}
  const useKey = useRefCounts(target[REFS])
  return function useOnTarget(key, fn) {
    const [useKeyFn, disposeUseKey] = useKey('useKey', (key) => {
      console.log('first useKey')
      return [useKey, () => {
        console.log('last useKey')        
      }]
    })
    const [value, unuseKey] = useKeyFn(key, fn)
    return [value, () => {
      unuseKey()
      disposeUseKey()
    }]
  }
}