---
editUrl: false
next: false
prev: false
title: "afterEvent"
---

> **afterEvent**\<`E`, `K`\>(`type`, `fn`): (`target`) => () => `void`

Defined in: [factory-machine-hooks.ts:47](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-hooks.ts#L47)

## Type Parameters

### E

`E` *extends* [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`any`\>

### K

`K` *extends* `string`

## Parameters

### type

`K`

### fn

[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E` & `object`\>

## Returns

> (`target`): () => `void`

### Parameters

#### target

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)

### Returns

> (): `void`

#### Returns

`void`
