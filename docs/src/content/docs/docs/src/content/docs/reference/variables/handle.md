---
editUrl: false
next: false
prev: false
title: "handle"
---

> `const` **handle**: \<`T`\>(...`config`) => (`target`) => () => `void`

Defined in: [state-machine-hooks.ts:96](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-hooks.ts#L96)

## Type Parameters

### T

`T` *extends* [`HasMethod`](/docs/src/content/docs/reference/type-aliases/hasmethod/)\<`"handle"`\>

## Parameters

### config

...\[(`ev`) => `undefined` \| `Parameters`\<[`MethodOf`](/docs/src/content/docs/reference/type-aliases/methodof/)\<`T`, `"handle"`\>\>\[`0`\]\]

## Returns

> (`target`): () => `void`

### Parameters

#### target

`T`

### Returns

> (): `void`

#### Returns

`void`
