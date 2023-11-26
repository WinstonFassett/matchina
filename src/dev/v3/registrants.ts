import { notify } from "./machine-setup";

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
>(target: T, init:(records: Record<K,F>) => void, kind = LISTENERS) {
  if (!target[kind]) {
    target[kind] = {};
    init?.(target[kind]);     
  }
  return (type: K, fn: F) => register(target, fn, type, kind);
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
