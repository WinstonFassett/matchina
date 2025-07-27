---
editUrl: false
next: false
prev: false
title: "resolveExitState"
---

> **resolveExitState**\<`FC`\>(`transition`, `ev`, `states`): `any`

Defined in: [factory-machine.ts:63](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine.ts#L63)

## Type Parameters

### FC

`FC` *extends* [`FactoryMachineContext`](/docs/src/content/docs/reference/interfaces/factorymachinecontext/)\<`any`\>

## Parameters

### transition

`undefined` | [`FactoryMachineTransition`](/docs/src/content/docs/reference/type-aliases/factorymachinetransition/)\<`FC`\[`"states"`\]\>

### ev

[`ResolveEvent`](/docs/src/content/docs/reference/type-aliases/resolveevent/)\<[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>\>

### states

`FC`\[`"states"`\]

## Returns

`any`
