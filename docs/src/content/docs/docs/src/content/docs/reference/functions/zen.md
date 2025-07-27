---
editUrl: false
next: false
prev: false
title: "zen"
---

> **zen**\<`M`\>(`machine`): `M` & [`DrainOuterGeneric`](/docs/src/content/docs/reference/type-aliases/drainoutergeneric/)\<\{ \[K in string \| number \| symbol\]: (object & TUnionToIntersection\<FlatMemberUnion\<StateEventTransitionSenders\<M, keyof (...)\[(...)\]\>\>\>)\[K\] \} & `object`\> & `object`

Defined in: [extras/zen.ts:5](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/extras/zen.ts#L5)

## Type Parameters

### M

`M` *extends* [`FactoryMachine`](/docs/src/content/docs/reference/interfaces/factorymachine/)\<`any`\>

## Parameters

### machine

`M`

## Returns

`M` & [`DrainOuterGeneric`](/docs/src/content/docs/reference/type-aliases/drainoutergeneric/)\<\{ \[K in string \| number \| symbol\]: (object & TUnionToIntersection\<FlatMemberUnion\<StateEventTransitionSenders\<M, keyof (...)\[(...)\]\>\>\>)\[K\] \} & `object`\> & `object`
