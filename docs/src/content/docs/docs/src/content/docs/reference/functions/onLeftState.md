---
editUrl: false
next: false
prev: false
title: "onLeftState"
---

> **onLeftState**\<`E`, `K`\>(`m`, `stateKey`, `fn`): [`Disposer`](/docs/src/content/docs/reference/type-aliases/disposer/)

Defined in: [factory-machine-hooks.ts:66](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-hooks.ts#L66)

## Type Parameters

### E

`E` *extends* [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`any`\>

### K

`K` *extends* `string` \| `number` \| `symbol`

## Parameters

### m

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>

### stateKey

`K`

### fn

[`ExitListener`](/docs/src/content/docs/reference/type-aliases/exitlistener/)\<`E` & `object`\>

## Returns

[`Disposer`](/docs/src/content/docs/reference/type-aliases/disposer/)
