---
editUrl: false
next: false
prev: false
title: "createApi"
---

> **createApi**\<`M`, `K`\>(`machine`, `filterStateKey?`): [`DrainOuterGeneric`](/docs/src/content/docs/reference/type-aliases/drainoutergeneric/)\<\{ \[K in string \| number \| symbol\]: (object & TUnionToIntersection\<FlatMemberUnion\<StateEventTransitionSenders\<M, keyof M\["transitions"\]\>\>\>)\[K\] \} & `object`\>

Defined in: [factory-machine-event-api.ts:8](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-event-api.ts#L8)

## Type Parameters

### M

`M` *extends* [`FactoryMachine`](/docs/src/content/docs/reference/interfaces/factorymachine/)\<`any`\>

### K

`K` *extends* `string` \| `number` \| `symbol` = keyof `M`\[`"transitions"`\]

## Parameters

### machine

`M`

### filterStateKey?

`K`

## Returns

[`DrainOuterGeneric`](/docs/src/content/docs/reference/type-aliases/drainoutergeneric/)\<\{ \[K in string \| number \| symbol\]: (object & TUnionToIntersection\<FlatMemberUnion\<StateEventTransitionSenders\<M, keyof M\["transitions"\]\>\>\>)\[K\] \} & `object`\>
