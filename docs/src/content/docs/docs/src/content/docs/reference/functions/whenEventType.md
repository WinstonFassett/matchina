---
editUrl: false
next: false
prev: false
title: "whenEventType"
---

> **whenEventType**\<`E`, `K`\>(`type`, `fn`): (`ev`) => `void`

Defined in: [factory-machine-hooks.ts:39](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-hooks.ts#L39)

## Type Parameters

### E

`E` *extends* [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`any`\>

### K

`K` *extends* `string`

## Parameters

### type

`K`

### fn

[`EntryListener`](/docs/src/content/docs/reference/type-aliases/entrylistener/)\<`E` & `object`\>

## Returns

> (`ev`): `void`

### Parameters

#### ev

`E`

### Returns

`void`
