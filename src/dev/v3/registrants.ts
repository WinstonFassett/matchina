import { notify } from "./machine-setup";

const LISTENERS = '_l';
const CLEANUP = '_c';
const DEFAULT = '_d';

export function listenTo<T>(target: T, kind = LISTENERS) {
  if (!target[kind]) {
    const unnotify = notify(ev => {
      runRegistrants(target, kind, ev.type, [ev]);
    });
    target[kind] = {
      [CLEANUP]: [
        unnotify
      ],
    };
  }
  return (typeOrFn, fn) => register(
    target,
    fn ?? typeOrFn,
    fn ? typeOrFn : DEFAULT,
    kind
  );
}
function runRegistrants<T>(target: T, kind: string, type: any, params: any[]) {
  runEffects(target[kind]?.[type], params);
}
function register(target, fn, type = DEFAULT, kind = LISTENERS) {
  target[kind] ??= {};
  target[kind][type] = (target[kind][type] ?? []).concat(fn);
  return () => {
    target[kind][type] = target[kind][type].filter(x => x !== fn);
    if (target[kind][type].length === 0) {
      delete target[kind][type];
    }
    if (Object.keys(target[kind]).length === 1) {
      runEffects(target[kind][CLEANUP]);
      delete target[kind];
    }
  };
}
const effector = (effects) => (...params) => {
  runEffects(effects, params);
};
function runEffects(effects: any, params: any[] = []) {
  effects?.forEach(listener => {
    listener(...params);
  });
}
function pipeValue(fns, value, params) {
  return fns.reduce((current, fn) => {
    return fn(...(params ?? [value]));
  }, value);
}

function withSubscribe<T>(target:T & Partial<{ subscribe: any }>) {
  if (target.subscribe) return target
  target.subscribe = listenTo(target)
  return () => {
    delete target.subscribe
  }
}
