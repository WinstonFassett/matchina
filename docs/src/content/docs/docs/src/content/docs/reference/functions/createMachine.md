---
editUrl: false
next: false
prev: false
title: "createMachine"
---

> **createMachine**\<`SF`, `TC`, `FC`, `E`\>(`states`, `transitions`, `init`): [`FactoryMachine`](/docs/src/content/docs/reference/interfaces/factorymachine/)\<`FC`\>

Defined in: [factory-machine.ts:15](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine.ts#L15)

## Type Parameters

### SF

`SF` *extends* [`StateFactory`](/docs/src/content/docs/reference/type-aliases/statefactory/)

### TC

`TC` *extends* [`FactoryMachineTransitions`](/docs/src/content/docs/reference/type-aliases/factorymachinetransitions/)\<`SF`\>

### FC

`FC` *extends* [`FactoryMachineContext`](/docs/src/content/docs/reference/interfaces/factorymachinecontext/)\<`SF`\> = \{ `states`: `SF`; `transitions`: `TC`; \}

### E

`E` *extends* [`StateMachineEvent`](/docs/src/content/docs/reference/interfaces/statemachineevent/)\<`ReturnType`\<`FC`\[`"states"`\]\[keyof `FC`\[`"states"`\]\]\>, `ReturnType`\<`FC`\[`"states"`\]\[keyof `FC`\[`"states"`\]\]\>\> & `FactoryMachineEventApi`\<`FC`\> & `object` = [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>

## Parameters

### states

`SF`

### transitions

`TC`

### init

[`KeysWithZeroRequiredArgs`](/docs/src/content/docs/reference/type-aliases/keyswithzerorequiredargs/)\<`FC`\[`"states"`\]\> | [`FactoryState`](/docs/src/content/docs/reference/type-aliases/factorystate/)\<`FC`\[`"states"`\]\>

## Returns

[`FactoryMachine`](/docs/src/content/docs/reference/interfaces/factorymachine/)\<`FC`\>
