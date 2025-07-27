---
editUrl: false
next: false
prev: false
title: "resolveExit"
---

> `const` **resolveExit**: \<`T`\>(...`config`) => (`target`) => () => `void`

Defined in: [state-machine-hooks.ts:93](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-hooks.ts#L93)

## Type Parameters

### T

`T` *extends* [`HasMethod`](/docs/src/content/docs/reference/type-aliases/hasmethod/)\<`"resolveExit"`\>

## Parameters

### config

...\[(`ev`) => `undefined` \| `Parameters`\<[`MethodOf`](/docs/src/content/docs/reference/type-aliases/methodof/)\<`T`, `"resolveExit"`\>\>\[`0`\]\]

## Returns

> (`target`): () => `void`

### Parameters

#### target

`T`

### Returns

> (): `void`

#### Returns

`void`
