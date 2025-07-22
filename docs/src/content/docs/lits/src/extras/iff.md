---
title: "iff"
description: "Add description here"
---


```ts
export type Handler<E> = (event: E) => any;

export function iff<E>(test: (ev: E) => boolean, fn: Handler<E>) {
  return (ev: E) => {
    if (test(ev)) {
      return fn(ev);
    }
  };
}
```
