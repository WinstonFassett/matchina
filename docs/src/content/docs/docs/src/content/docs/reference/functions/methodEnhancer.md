---
editUrl: false
next: false
prev: false
title: "methodEnhancer"
---

> **methodEnhancer**\<`K`\>(`methodName`): \<`T`\>(`fn`) => (`target`) => () => `void`

Defined in: [ext/methodware/method-enhancer.ts:5](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/ext/methodware/method-enhancer.ts#L5)

## Type Parameters

### K

`K` *extends* `string`

## Parameters

### methodName

`K`

## Returns

> \<`T`\>(`fn`): (`target`) => () => `void`

### Type Parameters

#### T

`T` *extends* [`HasMethod`](/docs/src/content/docs/reference/type-aliases/hasmethod/)\<`K`\>

### Parameters

#### fn

[`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`MethodOf`](/docs/src/content/docs/reference/type-aliases/methodof/)\<`T`, `K`\>\>

### Returns

> (`target`): () => `void`

#### Parameters

##### target

`T`

#### Returns

> (): `void`

##### Returns

`void`
