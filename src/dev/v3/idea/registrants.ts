import { notify } from "../machine-setup";

export type Disposer = () => void;


const LISTENERS = "_l";
export const CLEANUP = "_c";
const DEFAULT = "_d";

export function listenTo<T>(target: T, kind = LISTENERS) {
  if (!target[kind]) {
    const unnotify = notify((ev) => {
      runRegistrants(target, kind, ev.type, [ev]);
    });
    target[kind] = {
      [CLEANUP]: [unnotify],
    };
  }
  return (typeOrFn, fn) =>
    register(target, fn ?? typeOrFn, fn ? typeOrFn : DEFAULT, kind);
}
export function runRegistrants<V,K extends string, T>(target: T, kind: K, type: any, params: any[]) {
  runEffects(getRegistrants<V,K,T>(target, kind, type), params);
}

export function getRegistrants<V, K extends string, T>(target: T, kind: K, type: any) {
  return (target[kind as any]?.[type] ?? []) as V[];
}

export function registrar<
  F extends (...params: any[]) => any,
  K extends string = string,
  T = any
>(target: any, init:(records: Record<K,F>) => void, kind = LISTENERS as K) {
  if (!target[kind]) {
    target[kind] = {};
    init?.(target[kind]);     
  }
  return {
    register: <Type extends string>(type: Type, fn: F) => register(target, fn, type, kind),
    getRegistrants: <Type extends string>(type: Type) => getRegistrants<F,K,T>(target, kind, type),
  } 
}

// add _use: { [key]: [count, value]] } to target
const USES = '_uses'
const USE = '_use'

const usePropertiesOf = (target: any) => {
  return useProperty(USE, () => {
    let record = {} // consider exposing / returning        
    target[USES] = record
    return [use, dispose]
    function use(key: string, fn: (target, key) => any) {
      if (record[key]) {
        record[key][0]++
      } else {
        record[key] = [1, fn(target,key)]
      }
      return record[key][1]
    }
    function dispose () {}
  })(target);
}

/*
Use key once. Use ref count to clean up when no more uses.
 */
const useProperty = <T,K extends string,R>(key: K, fn: () => [T, Disposer]) => (target: R) => {
  // get or create property on target
  // const uses = registrar(target, (record) => {}, '_uses');
  // if property exists, use it
  let property = target[key as any] = target[key as any] ?? fn();
  // let use = property[USE]
  // do ref count
  return () => {
    // if ref count is 0, clean up
    // if ref count is 1, delete property
  }

}

export function register<F extends (...params: any[]) => any>(target: any, fn: F, type = DEFAULT, kind = LISTENERS) {
  target[kind] ??= {};
  target[kind][type] = (target[kind][type] ?? []).concat(fn);
  return function unregister() {
    target[kind][type] = target[kind][type].filter((x) => x !== fn);
    if (target[kind][type].length === 0) {
      delete target[kind][type];
    }
    if (Object.keys(target[kind]).length === 1) {
      runEffects(target[kind][CLEANUP]);
      delete target[kind];
    }
  };
}
const effector =
  (effects) =>
  (...params) => {
    runEffects(effects, params);
  };
export function runEffects(effects: any, params: any[] = []) {
  effects?.forEach((listener) => {
    listener(...params);
  });
}
function pipeValue(fns, value, params) {
  return fns.reduce((current, fn) => {
    return fn(...(params ?? [value]));
  }, value);
}

function withSubscribe<T>(target: T & Partial<{ subscribe: any }>) {
  if (target.subscribe) return target;
  target.subscribe = listenTo(target);
  return () => {
    delete target.subscribe;
  };
}
