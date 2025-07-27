---
editUrl: false
next: false
prev: false
title: "beforeEvent"
---

> **beforeEvent**\<`E`, `K`\>(`type`, `fn`): (`target`) => () => `void`

Defined in: [factory-machine-hooks.ts:11](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-hooks.ts#L11)

## Type Parameters

### E

`E` *extends* [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`any`\>

### K

`K` *extends* `string`

## Parameters

### type

`K`

### fn

[`AbortableEventHandler`](/docs/src/content/docs/reference/type-aliases/abortableeventhandler/)\<`E` & `object`\>

## Returns

> (`target`): () => `void`

### Parameters

#### target

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)

### Returns

> (): `void`

#### Returns

`void`
