---
editUrl: false
next: false
prev: false
title: "StateMachine"
---

Defined in: [state-machine-types.ts:17](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L17)

## Extended by

- [`FactoryMachine`](/docs/src/content/docs/reference/interfaces/factorymachine/)

## Type Parameters

### E

`E` *extends* [`StateMachineEvent`](/docs/src/content/docs/reference/interfaces/statemachineevent/) = [`StateMachineEvent`](/docs/src/content/docs/reference/interfaces/statemachineevent/)

## Properties

### send()

> **send**: (`type`, ...`params`) => `void`

Defined in: [state-machine-types.ts:20](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L20)

#### Parameters

##### type

`E`\[`"type"`\]

##### params

...`E`\[`"params"`\]

#### Returns

`void`

## Methods

### after()

> **after**(`ev`): `void`

Defined in: [state-machine-types.ts:31](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L31)

#### Parameters

##### ev

`E`

#### Returns

`void`

***

### before()

> **before**(`ev`): `undefined` \| `E`

Defined in: [state-machine-types.ts:25](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L25)

#### Parameters

##### ev

`E`

#### Returns

`undefined` \| `E`

***

### effect()

> **effect**(`ev`): `void`

Defined in: [state-machine-types.ts:27](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L27)

#### Parameters

##### ev

`E`

#### Returns

`void`

***

### enter()

> **enter**(`ev`): `void`

Defined in: [state-machine-types.ts:29](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L29)

#### Parameters

##### ev

`E`

#### Returns

`void`

***

### getChange()

> **getChange**(): `E`

Defined in: [state-machine-types.ts:19](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L19)

#### Returns

`E`

***

### getState()

> **getState**(): `E`\[`"to"`\] \| `E`\[`"from"`\]

Defined in: [state-machine-types.ts:18](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L18)

#### Returns

`E`\[`"to"`\] \| `E`\[`"from"`\]

***

### guard()

> **guard**(`ev`): `boolean`

Defined in: [state-machine-types.ts:23](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L23)

#### Parameters

##### ev

`E`

#### Returns

`boolean`

***

### handle()

> **handle**(`ev`): `undefined` \| `E`

Defined in: [state-machine-types.ts:24](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L24)

#### Parameters

##### ev

`E`

#### Returns

`undefined` \| `E`

***

### leave()

> **leave**(`ev`): `void`

Defined in: [state-machine-types.ts:28](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L28)

#### Parameters

##### ev

`E`

#### Returns

`void`

***

### notify()

> **notify**(`ev`): `void`

Defined in: [state-machine-types.ts:30](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L30)

#### Parameters

##### ev

`E`

#### Returns

`void`

***

### resolveExit()

> **resolveExit**(`ev`): `undefined` \| `E`

Defined in: [state-machine-types.ts:21](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L21)

#### Parameters

##### ev

[`ResolveEvent`](/docs/src/content/docs/reference/type-aliases/resolveevent/)\<`E`\>

#### Returns

`undefined` \| `E`

***

### transition()

> **transition**(`change`): `void`

Defined in: [state-machine-types.ts:22](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L22)

#### Parameters

##### change

`E`

#### Returns

`void`

***

### update()

> **update**(`ev`): `void`

Defined in: [state-machine-types.ts:26](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L26)

#### Parameters

##### ev

`E`

#### Returns

`void`
