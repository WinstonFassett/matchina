---
title: "delay"
description: "Add description here"
---


```ts
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
export const delayed = async <T>(ms: number, result: T) => {
  await delay(ms);
  return result;
};

export const delayer =
  <T>(ms: number, result: T) =>
  async () => {
    return await delayed(ms, result);
  };
```
