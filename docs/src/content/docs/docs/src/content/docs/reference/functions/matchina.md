---
editUrl: false
next: false
prev: false
title: "matchina"
---

> **matchina**\<`SF`, `TC`, `FC`\>(`states`, `transitions`, `init`): [`FactoryMachine`](/docs/src/content/docs/reference/interfaces/factorymachine/)\<`FC`\> & [`DrainOuterGeneric`](/docs/src/content/docs/reference/type-aliases/drainoutergeneric/)\<\{ \[K in string \| number \| symbol\]: (object & TUnionToIntersection\<FlatMemberUnion\<StateEventTransitionSenders\<FactoryMachine\<FC\>, keyof (...)\[(...)\]\>\>\>)\[K\] \} & `object`\> & `object`

Defined in: [matchina.ts:11](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchina.ts#L11)

## Type Parameters

### SF

`SF` *extends* [`StateFactory`](/docs/src/content/docs/reference/type-aliases/statefactory/)

### TC

`TC` *extends* [`FactoryMachineTransitions`](/docs/src/content/docs/reference/type-aliases/factorymachinetransitions/)\<`SF`\>

### FC

`FC` *extends* [`FactoryMachineContext`](/docs/src/content/docs/reference/interfaces/factorymachinecontext/)\<`SF`\> = \{ `states`: `SF`; `transitions`: `TC`; \}

## Parameters

### states

`SF`

### transitions

`TC`

### init

[`KeysWithZeroRequiredArgs`](/docs/src/content/docs/reference/type-aliases/keyswithzerorequiredargs/)\<`FC`\[`"states"`\]\> | [`FactoryState`](/docs/src/content/docs/reference/type-aliases/factorystate/)\<`FC`\[`"states"`\]\>

## Returns

[`FactoryMachine`](/docs/src/content/docs/reference/interfaces/factorymachine/)\<`FC`\> & [`DrainOuterGeneric`](/docs/src/content/docs/reference/type-aliases/drainoutergeneric/)\<\{ \[K in string \| number \| symbol\]: (object & TUnionToIntersection\<FlatMemberUnion\<StateEventTransitionSenders\<FactoryMachine\<FC\>, keyof (...)\[(...)\]\>\>\>)\[K\] \} & `object`\> & `object`
