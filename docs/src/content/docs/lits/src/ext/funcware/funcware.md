---
title: "funcware"
description: "Add description here"
---


```ts
export type Funcware<F extends (...params: any[]) => any> = (inner: F) => F;
```
