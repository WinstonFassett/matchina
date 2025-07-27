---
editUrl: false
next: false
prev: false
title: "onBeforeEvent"
---

> **onBeforeEvent**\<`E`\>(`m`, `type`, `fn`): [`Disposer`](/docs/src/content/docs/reference/type-aliases/disposer/)

Defined in: [factory-machine-hooks.ts:60](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-hooks.ts#L60)

## Type Parameters

### E

`E` *extends* [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`any`\>

## Parameters

### m

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>

### type

`E`\[`"type"`\]

### fn

[`AbortableEventHandler`](/docs/src/content/docs/reference/type-aliases/abortableeventhandler/)\<`E` & `object`\>

## Returns

[`Disposer`](/docs/src/content/docs/reference/type-aliases/disposer/)
