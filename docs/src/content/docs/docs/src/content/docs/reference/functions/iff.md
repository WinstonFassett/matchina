---
editUrl: false
next: false
prev: false
title: "iff"
---

> **iff**\<`F`\>(`test`, `ware`): (`inner`) => (...`params`) => `any`

Defined in: [ext/funcware/iff.ts:4](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/ext/funcware/iff.ts#L4)

## Type Parameters

### F

`F` *extends* (...`params`) => `any`

## Parameters

### test

(...`params`) => `boolean` \| `void`

### ware

[`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<`F`\>

## Returns

> (`inner`): (...`params`) => `any`

### Parameters

#### inner

`F`

### Returns

> (...`params`): `any`

#### Parameters

##### params

...`Parameters`\<`F`\>

#### Returns

`any`
