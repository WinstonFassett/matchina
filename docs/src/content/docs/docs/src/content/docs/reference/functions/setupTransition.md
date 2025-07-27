---
editUrl: false
next: false
prev: false
title: "setupTransition"
---

> **setupTransition**\<`E`, `F`\>(`machine`, `filter`, ...`setups`): () => `void`

Defined in: [state-machine-hooks.ts:139](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-hooks.ts#L139)

## Type Parameters

### E

`E` *extends* [`StateMachineEvent`](/docs/src/content/docs/reference/interfaces/statemachineevent/)\<[`State`](/docs/src/content/docs/reference/interfaces/state/), [`State`](/docs/src/content/docs/reference/interfaces/state/)\>

### F

`F` *extends* [`FlatFilters`](/docs/src/content/docs/reference/type-aliases/flatfilters/)\<[`ChangeEventKeys`](/docs/src/content/docs/reference/type-aliases/changeeventkeys/)\<`E`\>\>

## Parameters

### machine

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>

### filter

`F`

### setups

...[`Setup`](/docs/src/content/docs/reference/type-aliases/setup/)\<[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<[`HasFilterValues`](/docs/src/content/docs/reference/type-aliases/hasfiltervalues/)\<`E`, `F`\>\>\>[]

## Returns

> (): `void`

### Returns

`void`
