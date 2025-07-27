---
editUrl: false
next: false
prev: false
title: "FactoryMachineEventImpl"
---

Defined in: [factory-machine-event.ts:4](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-event.ts#L4)

## Type Parameters

### E

`E` *extends* [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`any`\>

## Constructors

### Constructor

> **new FactoryMachineEventImpl**\<`E`\>(`type`, `from`, `to`, `params`): `FactoryMachineEventImpl`\<`E`\>

Defined in: [factory-machine-event.ts:10](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-event.ts#L10)

#### Parameters

##### type

`E`\[`"type"`\]

##### from

`E`\[`"from"`\]

##### to

`E`\[`"to"`\]

##### params

`E`\[`"params"`\]

#### Returns

`FactoryMachineEventImpl`\<`E`\>

## Properties

### from

> **from**: `E`\[`"from"`\]

Defined in: [factory-machine-event.ts:6](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-event.ts#L6)

***

### params

> **params**: `E`\[`"params"`\]

Defined in: [factory-machine-event.ts:8](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-event.ts#L8)

***

### to

> **to**: `E`\[`"to"`\]

Defined in: [factory-machine-event.ts:7](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-event.ts#L7)

***

### type

> **type**: `E`\[`"type"`\]

Defined in: [factory-machine-event.ts:5](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-event.ts#L5)

## Methods

### match()

> **match**\<`A`, `C`, `Exhaustive`\>(`cases`, `exhaustive`): `A`

Defined in: [factory-machine-event.ts:22](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-event.ts#L22)

#### Type Parameters

##### A

`A`

##### C

`C` *extends* [`Cases`](/docs/src/content/docs/reference/type-aliases/cases/)\<`any`, `A`\> & `object` \| `PartialCases`\<`any`, `A`\> \| `Partial`\<[`Cases`](/docs/src/content/docs/reference/type-aliases/cases/)\<`any`, `A`\> & `object`\>

##### Exhaustive

`Exhaustive` *extends* `boolean` = `false`

#### Parameters

##### cases

[`MatchCases`](/docs/src/content/docs/reference/type-aliases/matchcases/)\<`C`, `A`, `Exhaustive`\>

##### exhaustive

`Exhaustive`

#### Returns

`A`
