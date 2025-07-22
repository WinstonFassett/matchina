---
title: "types"
description: "Add description here"
---


```ts
export type Effect<E> = (ev: E) => void;

export type Middleware<E> = (event: E, next: (event: E) => void) => void;
```
