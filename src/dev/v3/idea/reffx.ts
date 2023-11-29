type Disposer = () => void;

/**
 * Creates an effect subscription function that maintains a certain effect
 * indicated by the `effect` argument as long as there are subscribers to the
 * effect. When all subscribing references are destroyed, the effect's disposer
 * is invoked.
 * @param effect
 */
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

function noop() {}



export interface MapInterface<K, T> {
  set(key: K, value: T): void;
  delete(key: K): void;
  get(key: K): T | undefined;
}

class ObjectMap<K extends string, T> implements MapInterface<K, T> {
  constructor(private obj: Record<K, T>) {}
  set(key: K, value: T) {
    this.obj[key] =  value;
  }
  delete(key: K) {
    delete this.obj[key]
  }
  get(key: K) {
    return this.obj[key]
  }
}

export interface MapConstructor<K> {
  new <T>(): MapInterface<K, T>;
}

export function keyedReffx<T>(
  effect: (key: T) => Disposer,
  fxs = new Map() as MapInterface<T, () => Disposer>
) {
  return function addRef(key: T, meta?: unknown): Disposer {
    const fx =
      fxs.get(key) ||
      reffx(() => {
        const disposeFx = effect(key);
        return () => (fxs.delete(key), disposeFx());
      });
    fxs.set(key, fx);
    return fx(meta);
  };

}


/**
 * Like `keyedReffx` but the effect can return a referentially stable object that
 * exposes further functionality to be used while the effect is active.
 * @param effect
 */
export function keyedObjectReffx<K, T, U = readonly [T, Disposer]>(
  effect: (key: K) => readonly [T, Disposer],
  decorate: (value: T, disposer: Disposer) => U = (value, disposer) =>
    ([value, disposer] as unknown) as U,
  MapImpl: MapConstructor<K> = Map
) {
  const valueMap = new MapImpl<T>();
  const fx = keyedReffx((key: K) => {
    const [value, disposer] = effect(key);
    valueMap.set(key, value);
    return () => {
      valueMap.delete(key);
      disposer();
    };
  }, new MapImpl());

  /**
   * Adds a reference to the maintained effect. If this is the first reference,
   * the effect will be invoked. Returns a tuple of the effect object and a
   * disposer that removes this reference.
   */
  return function addRef(key: K, meta?: unknown): U {
    const disposer = fx(key, meta);
    return decorate(valueMap.get(key)!, disposer);
  };
}
