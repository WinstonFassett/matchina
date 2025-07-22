---
title: "setup"
description: "Add description here"
---


```ts
export type Setup<T> = (target: T) => Disposer;
export type Disposer = () => void;

/**
 * Run cleanup functions in reverse order
 * @param fns
 * @returns
```
Run cleanup functions in reverse order
```ts
export const disposers = (fns: Disposer[]) => () => {
  for (let i = fns.length - 1; i >= 0; i--) {
    fns[i]();
  }
};

export const createSetup: <T>(...setups: Setup<T>[]) => Setup<T> =
  (...setups) =>
  (target) =>
    disposers(setups.map((fn) => fn(target)));

export const setup =
  <T>(target: T): ((...setups: Setup<T>[]) => Disposer) =>
  (...setups: Setup<T>[]) =>
    disposers(setups.map((fn) => fn(target)));

export const buildSetup = <T>(target: T) => {
  const d: Disposer[] = [];
  const add = (...setups: Setup<T>[]) => {
    d.push(...setups.map((fn) => fn(target)));
    return () => {
      for (let i = d.length - 1; i >= 0; i--) {
        d[i]();
      }
    };
  };
  return [add, () => disposers(d)()];
};
```
