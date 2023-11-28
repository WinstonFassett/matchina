import { Disposer, registrar } from "./registrants";
import { disposers } from "./setup";

type RefState = Record<string, [count: number, value: any]>;

/**
 *
 * @param target - n/a
 * @param record to use for ref counts
 * @returns use(key, fn) => [value, unuse]
 */
const SELF = 'useRefCounts'
export const useKeyedRefCounts = (
  record: RefState = {},
  init?: (record: RefState) => void|Disposer,
) => {
  return useKey;

  function useSelf() {
    return useKey(SELF, () => {
      console.log('setup ref counting');
      let onDispose = init?.(record);
      return () => {
        onDispose?.();
        console.log('cleanup ref counting');
      };
    });
  }
  function useKey<K extends string, R>(
    key: K,
    fn: (key: K) => R
  ) {
    const disposeSelf = key!==SELF ? useSelf() : undefined;
    if (record[key]) {
      record[key][0]++;
    } else {
      record[key] = [1, fn(key)];
    }
    return function unuse() {
      const item = record[key]
      item[0]--;
      if (item[0] === 0) {
        const cleanupItem = item[1];
        delete record[key];
        cleanupItem();
        disposeSelf?.();      
      }
    }
  }
};
export function disposeRefCounts(record: RefState) {
  Object.keys(record).forEach((key) => {
    record[key][1]();
  });
}

function test() {
  const x = {};
  return useDynamicProperty(x, 'someProperty', () => ['some value', noop]);
}

const REFS = '_refs'

function dynamicProperty<T, K extends string, V>(target: T, key: K, create: () => [value: V, dispose: Disposer]) {  
  const store = target as any  
  const orig = store[key];
  store[key] = create();
  return () => {
    store[key] = orig;
  };
}
const PROPERTIES = '_p'

// if property does not exist create it
// if property reffx does not exist create it
// where to create it? _refs._p[key]
// use property reffx
// when none left, delete property
function useProperty<T extends object, K extends string, V>(target: T, key: K, init?: () => Disposer) {
  const [refs, unuseRefs] = useRefsRoot(target)
  if (!refs[PROPERTIES]) refs[PROPERTIES] = {}
  const usePropertiesKey = useKeyedRefCounts(refs[PROPERTIES], () => {
    console.log('create property tracking')
    return () => {
      console.log('cleanup property tracking')
      // should be safe to delete now
      delete refs[PROPERTIES]
    }
  })
  const unuseProperty = usePropertiesKey(key, () => {
    console.log('first use of property', key)
    return () => {
      console.log('last use of property', key)
    }
  })
  return disposers([unuseRefs, unuseProperty])
}

function useRefsRoot<T extends object>(target: T) {
  const unuseRefs = useDynamicProperty(target, REFS, () => [{
    helloRefs: true
  }, () => {
    console.log('cleanup refs root')
  }])
  const refs = target[REFS]  
  return [refs, () => {  
    unuseRefs()
  }] as [refs: typeof refs, unuse: () => void]  

}

function useDynamicProperty<T extends object, K extends string, V>(target: T, key: K, create: () => [value: V, dispose: Disposer]) {  
  return useProperty(target, key, () => {
    const store = target as any
    const orig = store[key]
    const [value, dispose] = create()
    store[key] = value
    return dispose
  })
}

const TEMP = '_temp'

// function useTempProperties(target: any, kind = TEMP) {
//   return function useTempProperty<K extends string, V>(key: K, create: () => [value: V, dispose: Disposer]) {
//     const unuseTemp = useDynamicProperty(target, kind, () => [{}, () => {
//       console.log('cleanup temp property')
//     }])
//     const temps = target[kind]
//     if (temps[key]) return temps[key]
//     // const temp = target[kind]
//     // if (temp[key]) return temp[key]
//     temps[key] = create()
//     return () => {
//       delete temps[key]
//       unuseTemp()
//     }
//   }  
// }
const noop = () => {}
// export function useRefCountsOn<T extends object>(target: T) {
//   target[REFS] ??= {};
//   const useKey = useKeyedRefCounts(target[REFS]);
//   return function useOnTarget<R>(key: string, fn: (key: string) => R) {
//     const disposeUseKey = useKey('useKey', (key) => {
//       console.log('first useKey');
//       return () => {
//         console.log('last useKey');
//       };
//     });
//     const unuseKey = useKey(key, fn);
//     return () => {
//       unuseKey();
//       disposeUseKey();
//     };
//   };
// }


export function reffx(effect: () => Disposer) {
  let count = 0
  let disposer: Disposer|undefined = undefined;

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
      if (count===0) {
        const dispose = disposer;
        disposer = undefined;
        dispose?.();
      }
    };
  };
}