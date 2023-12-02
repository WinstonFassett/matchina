import { Disposer, disposers } from "../setup";

type RefState = Record<string, [count: number, value: any]>;

/**
 *
 * @param target - any object to use for ref counts
 * @param init entry/exit callback
 * @returns use(key, fn) => unuse
 */
const SELF = "useRefCounts";
export const useKeyedRefCounts = (
  record: RefState = {},
  init?: (record: RefState) => void | Disposer,
) => {
  return useKey;

  function useSelf() {
    return useKey(SELF, () => {
      console.log("setup ref counting");
      let onDispose = init?.(record);
      return () => {
        onDispose?.();
        console.log("cleanup ref counting");
      };
    });
  }
  function useKey<K extends string, R>(key: K, fn: (key: K) => R) {
    const disposeSelf = key !== SELF ? useSelf() : undefined;
    if (record[key]) {
      record[key][0]++;
    } else {
      record[key] = [1, fn(key)];
    }
    return function unuse() {
      const item = record[key];
      item[0]--;
      if (item[0] === 0) {
        const cleanupItem = item[1];
        delete record[key];
        cleanupItem();
        disposeSelf?.();
      }
    };
  }
};
export function disposeRefCounts(record: RefState) {
  Object.keys(record).forEach((key) => {
    record[key][1]();
  });
}

function test() {
  const x = {};
  return useDynamicProperty(x, "someProperty", () => ["some value", noop]);
}

const REFS = "_refs";

function dynamicProperty<T, K extends string, V>(
  target: T,
  key: K,
  create: () => [value: V, dispose: Disposer],
) {
  const store = target as any;
  const orig = store[key];
  store[key] = create();
  return () => {
    store[key] = orig;
  };
}
const PROPERTIES = "_p";

function useProperties<T extends object, K extends string, V>(target: T) {
  const [refs, unuseRefs] = useRefsRoot(target);
  if (!refs[PROPERTIES]) refs[PROPERTIES] = {};
  const usePropertiesKey = useKeyedRefCounts(refs[PROPERTIES], () => {
    console.log("create property tracking");
    return () => {
      console.log("cleanup property tracking");
      // should be safe to delete now
      delete refs[PROPERTIES];
    };
  });
  return [usePropertiesKey, disposers([unuseRefs])] as [
    use: typeof usePropertiesKey,
    unuse: () => void,
  ];
}

// if property does not exist create it
// if property reffx does not exist create it
// where to create it? _refs._p[key]
// use property reffx
// when none left, delete property
function useProperty<T extends object, K extends string, V>(
  target: T,
  key: K,
  init?: () => Disposer,
) {
  const [refs, unuseRefs] = useRefsRoot(target);
  if (!refs[PROPERTIES]) refs[PROPERTIES] = {};
  const [usePropertiesKey, unuseProperties] = useProperties(target);
  // const [usePropertiesKey, unuseProperties] = useRefsRootKey(refs, PROPERTIES)
  const unuseProperty = usePropertiesKey(key, () => {
    console.log("first use of property", key);
    return () => {
      console.log("last use of property", key);
    };
  });
  return disposers([unuseRefs, unuseProperties, unuseProperty]);
}

function useRefsRoot<T extends object>(target: T) {
  const unuseRefs = useDynamicProperty(target, REFS, () => [
    {
      helloRefs: true,
    },
    () => {
      console.log("cleanup refs root");
    },
  ]);
  const refs = target[REFS];
  return [
    refs,
    () => {
      unuseRefs();
    },
  ] as [refs: typeof refs, unuse: () => void];
}

function useRefsRootKey<T extends object, K extends string>(target: T, key: K) {
  const [refs, unuseRefs] = useRefsRoot(target);
  if (!refs[key]) refs[key] = {};
  const useKey = useKeyedRefCounts(refs[key], () => {
    console.log("create refs key", key);
    return () => {
      console.log("cleanup refs key", key);
      // should be safe to delete now
      delete refs[key];
    };
  });
  return [useKey, unuseRefs];
}

function useDynamicProperty<T extends object, K extends string, V>(
  target: T,
  key: K,
  create: () => [value: V, dispose: Disposer],
) {
  return useProperty(target, key, () => {
    return dynamicProperty(target, key, create);
  });
}

const TEMP = "_";

function useTempProperty<T extends object, K extends string, V>(
  target: T,
  key: K,
  create: () => [value: V, dispose: Disposer],
) {
  const [refs, unuseRefs] = useRefsRoot(target);
  const unuseTemp = useDynamicProperty(refs, TEMP, () => [
    {},
    () => {
      console.log("cleanup temp property");
    },
  ]);
  const unuseProperty = useDynamicProperty(target[TEMP], key, create);
  return disposers([unuseRefs, unuseTemp, unuseProperty]);
}

// function useRefsRootPath<T extends object, K extends string, V>(target: T, path: K[], create: () => [value: V, dispose: Disposer]) {
//   const [refs, unuseRefs] = useRefsRoot(target)
//   let current = refs
//   const unuseParts = path.map((key, i) => {
//     if (i === path.length-1) return useDynamicProperty(current, key, create)
//     return useDynamicProperty(current, key, () => {
//       current = current[key]
//       return [{}, () => {
//       console.log('cleanup refs path', path.slice(0, i))
//     }]})
//   })
//   return disposers([unuseRefs, ...unuseParts])
// }

const noop = () => {};

export function reffx(effect: () => Disposer) {
  let count = 0;
  let disposer: Disposer | undefined = undefined;

  /**
   * Adds a reference to the maintained effect. If this is the first reference,
   * the effect will be invoked. Returns a disposer that removes this reference.
   */
  return function addRef(meta?: unknown): Disposer {
    count++;
    if (count === 1) disposer = effect();

    return function removeRef() {
      if (count === 0) return;
      count--;
      if (count === 0) {
        const dispose = disposer;
        disposer = undefined;
        dispose?.();
      }
    };
  };
}
