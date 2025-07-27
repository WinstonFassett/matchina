---
editUrl: false
next: false
prev: false
title: "onExecute"
---

> `const` **onExecute**: \<`T`\>(`fn`) => (`target`) => () => `void`

Defined in: [promise-machine-hooks.ts:3](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/promise-machine-hooks.ts#L3)

## Type Parameters

### T

`T` *extends* [`HasMethod`](/docs/src/content/docs/reference/type-aliases/hasmethod/)\<`"execute"`\>

## Parameters

### fn

[`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`MethodOf`](/docs/src/content/docs/reference/type-aliases/methodof/)\<`T`, `"execute"`\>\>

## Returns

> (`target`): () => `void`

### Parameters

#### target

`T`

### Returns

> (): `void`

#### Returns

`void`
