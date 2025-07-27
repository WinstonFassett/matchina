---
editUrl: false
next: false
prev: false
title: "FactoryMachineTransitionEvent"
---

> **FactoryMachineTransitionEvent**\<`FC`, `FromKey`, `EventKey`, `ToKey`\> = [`StateMachineEvent`](/docs/src/content/docs/reference/interfaces/statemachineevent/)\<[`FactoryState`](/docs/src/content/docs/reference/type-aliases/factorystate/)\<`FC`\[`"states"`\]\>\> & `FactoryMachineEventApi`\<`FC`\> & `object` & `ToKey` *extends* keyof `FC`\[`"states"`\] ? `object` : `ToKey` *extends* (...`args`) => (...`innerArgs`) => infer R ? `object` : `ToKey` *extends* (...`args`) => infer R ? `object` : `never`

Defined in: [factory-machine-types.ts:55](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-types.ts#L55)

## Type declaration

### from

> **from**: [`FactoryState`](/docs/src/content/docs/reference/type-aliases/factorystate/)\<`FC`\[`"states"`\], `FromKey` *extends* keyof `FC`\[`"states"`\] ? `FromKey` : `any`\>

### type

> **type**: `EventKey`

## Type Parameters

### FC

`FC` *extends* [`FactoryMachineContext`](/docs/src/content/docs/reference/interfaces/factorymachinecontext/)\<`any`\>

### FromKey

`FromKey` *extends* keyof `FC`\[`"transitions"`\] = keyof `FC`\[`"transitions"`\]

### EventKey

`EventKey` *extends* keyof `FC`\[`"transitions"`\]\[`FromKey`\] = keyof `FC`\[`"transitions"`\]\[`FromKey`\]

### ToKey

`ToKey` *extends* `FC`\[`"transitions"`\]\[`FromKey`\]\[`EventKey`\] = `FC`\[`"transitions"`\]\[`FromKey`\]\[`EventKey`\]
