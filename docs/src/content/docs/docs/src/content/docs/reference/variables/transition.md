---
editUrl: false
next: false
prev: false
title: "transition"
---

> `const` **transition**: \<`T`\>(...`config`) => (`target`) => () => `void`

Defined in: [state-machine-hooks.ts:92](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-hooks.ts#L92)

## Type Parameters

### T

`T` *extends* [`HasMethod`](/docs/src/content/docs/reference/type-aliases/hasmethod/)\<`"transition"`\>

## Parameters

### config

...\[[`Middleware`](/docs/src/content/docs/reference/type-aliases/middleware/)\<`Parameters`\<[`MethodOf`](/docs/src/content/docs/reference/type-aliases/methodof/)\<`T`, `"transition"`\>\>\[`0`\]\>\]

## Returns

> (`target`): () => `void`

### Parameters

#### target

`T`

### Returns

> (): `void`

#### Returns

`void`
