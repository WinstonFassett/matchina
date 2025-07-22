---
title: "ensure-property"
description: "Add description here"
---


```ts
import { setup } from "./setup";

export function ensureProperty<
  T,
  F extends (...args: any) => any = (...args: any) => any,
  K extends string = string,
  O extends { [key in K]: ReturnType<F> } = { [key in K]: ReturnType<F> },
>(target: T, key: K, fn: F) {
  const enhanced = target as T & O;
  enhanced[key] = enhanced[key] ?? fn(target);
  return enhanced;
}

// Example usage (for testing, can be removed in production)
const testThing = { bar: new Error("test") } as const;
console.log(testThing.bar.message); // this works

function fooFactory(x: number) {
  return "ok";
}
const thing2WithFoo = ensureProperty(testThing, "foo", fooFactory);
console.log(thing2WithFoo.foo); // this works
console.log(thing2WithFoo.bar.message); // this is typed as any. Should be type error
```
