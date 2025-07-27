---
editUrl: false
next: false
prev: false
title: "FactoryMachine"
---

Defined in: [factory-machine-types.ts:21](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-types.ts#L21)

## Extends

- [`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>\>

## Type Parameters

### FC

`FC` *extends* [`FactoryMachineContext`](/docs/src/content/docs/reference/interfaces/factorymachinecontext/)\<`any`\>

## Properties

### send()

> **send**: (`type`, ...`params`) => `void`

Defined in: [state-machine-types.ts:20](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L20)

#### Parameters

##### type

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>\[`"type"`\]

##### params

...[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>\[`"params"`\]

#### Returns

`void`

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`send`](/docs/src/content/docs/reference/interfaces/statemachine/#send)

***

### states

> **states**: `FC`\[`"states"`\]

Defined in: [factory-machine-types.ts:23](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-types.ts#L23)

***

### transitions

> **transitions**: `FC`\[`"transitions"`\]

Defined in: [factory-machine-types.ts:24](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-types.ts#L24)

## Methods

### after()

> **after**(`ev`): `void`

Defined in: [state-machine-types.ts:31](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L31)

#### Parameters

##### ev

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Returns

`void`

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`after`](/docs/src/content/docs/reference/interfaces/statemachine/#after)

***

### before()

> **before**(`ev`): `undefined` \| [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>

Defined in: [state-machine-types.ts:25](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L25)

#### Parameters

##### ev

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Returns

`undefined` \| [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`before`](/docs/src/content/docs/reference/interfaces/statemachine/#before)

***

### effect()

> **effect**(`ev`): `void`

Defined in: [state-machine-types.ts:27](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L27)

#### Parameters

##### ev

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Returns

`void`

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`effect`](/docs/src/content/docs/reference/interfaces/statemachine/#effect)

***

### enter()

> **enter**(`ev`): `void`

Defined in: [state-machine-types.ts:29](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L29)

#### Parameters

##### ev

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Returns

`void`

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`enter`](/docs/src/content/docs/reference/interfaces/statemachine/#enter)

***

### getChange()

> **getChange**(): [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

Defined in: [state-machine-types.ts:19](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L19)

#### Returns

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`getChange`](/docs/src/content/docs/reference/interfaces/statemachine/#getchange)

***

### getState()

> **getState**(): [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>\[`"to"`\] \| [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>\[`"from"`\]

Defined in: [state-machine-types.ts:18](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L18)

#### Returns

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>\[`"to"`\] \| [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>\[`"from"`\]

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`getState`](/docs/src/content/docs/reference/interfaces/statemachine/#getstate)

***

### guard()

> **guard**(`ev`): `boolean`

Defined in: [state-machine-types.ts:23](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L23)

#### Parameters

##### ev

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Returns

`boolean`

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`guard`](/docs/src/content/docs/reference/interfaces/statemachine/#guard)

***

### handle()

> **handle**(`ev`): `undefined` \| [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>

Defined in: [state-machine-types.ts:24](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L24)

#### Parameters

##### ev

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Returns

`undefined` \| [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`handle`](/docs/src/content/docs/reference/interfaces/statemachine/#handle)

***

### leave()

> **leave**(`ev`): `void`

Defined in: [state-machine-types.ts:28](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L28)

#### Parameters

##### ev

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Returns

`void`

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`leave`](/docs/src/content/docs/reference/interfaces/statemachine/#leave)

***

### notify()

> **notify**(`ev`): `void`

Defined in: [state-machine-types.ts:30](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L30)

#### Parameters

##### ev

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Returns

`void`

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`notify`](/docs/src/content/docs/reference/interfaces/statemachine/#notify)

***

### resolveExit()

> **resolveExit**(`ev`): `undefined` \| [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>

Defined in: [state-machine-types.ts:21](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L21)

#### Parameters

##### ev

[`ResolveEvent`](/docs/src/content/docs/reference/type-aliases/resolveevent/)\<`E`\>

#### Returns

`undefined` \| [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`FC`\>

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`resolveExit`](/docs/src/content/docs/reference/interfaces/statemachine/#resolveexit)

***

### transition()

> **transition**(`change`): `void`

Defined in: [state-machine-types.ts:22](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L22)

#### Parameters

##### change

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Returns

`void`

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`transition`](/docs/src/content/docs/reference/interfaces/statemachine/#transition)

***

### update()

> **update**(`ev`): `void`

Defined in: [state-machine-types.ts:26](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L26)

#### Parameters

##### ev

[`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)

#### Returns

`void`

#### Inherited from

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/).[`update`](/docs/src/content/docs/reference/interfaces/statemachine/#update)
