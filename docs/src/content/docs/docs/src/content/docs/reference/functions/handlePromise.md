---
editUrl: false
next: false
prev: false
title: "handlePromise"
---

> **handlePromise**\<`F`, `Type`, `Resolve`, `Reject`\>(`makePromise`, `trigger`, `resolve`, `reject`): (`machine`) => () => `void`

Defined in: [promise-handle.ts:4](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/promise-handle.ts#L4)

## Type Parameters

### F

`F` *extends* [`PromiseCallback`](/docs/src/content/docs/reference/type-aliases/promisecallback/)

### Type

`Type` = `"execute"`

### Resolve

`Resolve` = `"resolve"`

### Reject

`Reject` = `"reject"`

## Parameters

### makePromise

`F`

### trigger

`Type` = `...`

### resolve

`Resolve` = `...`

### reject

`Reject` = `...`

## Returns

> (`machine`): () => `void`

### Parameters

#### machine

[`PromiseMachine`](/docs/src/content/docs/reference/type-aliases/promisemachine/)\<`F`\>

### Returns

> (): `void`

#### Returns

`void`
