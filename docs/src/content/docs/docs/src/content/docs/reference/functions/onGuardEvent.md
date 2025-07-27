---
editUrl: false
next: false
prev: false
title: "onGuardEvent"
---

> **onGuardEvent**\<`E`, `K`\>(`m`, `type`, `fn`): [`Disposer`](/docs/src/content/docs/reference/type-aliases/disposer/)

Defined in: [factory-machine-hooks.ts:93](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-hooks.ts#L93)

## Type Parameters

### E

`E` *extends* [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`any`\>

### K

`K` *extends* `string`

## Parameters

### m

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>

### type

`K`

### fn

(`ev`) => `boolean`

## Returns

[`Disposer`](/docs/src/content/docs/reference/type-aliases/disposer/)
