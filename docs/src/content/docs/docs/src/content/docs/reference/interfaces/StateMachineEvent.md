---
editUrl: false
next: false
prev: false
title: "StateMachineEvent"
---

Defined in: [state-machine-types.ts:3](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L3)

## Type Parameters

### To

`To` *extends* [`State`](/docs/src/content/docs/reference/interfaces/state/) = [`State`](/docs/src/content/docs/reference/interfaces/state/)

### From

`From` *extends* [`State`](/docs/src/content/docs/reference/interfaces/state/) = `To`

## Properties

### from

> **from**: `From`

Defined in: [state-machine-types.ts:10](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L10)

***

### params

> **params**: `any`[]

Defined in: [state-machine-types.ts:8](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L8)

***

### to

> **to**: `To`

Defined in: [state-machine-types.ts:9](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L9)

***

### type

> **type**: `string`

Defined in: [state-machine-types.ts:7](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L7)

## Accessors

### machine

#### Get Signature

> **get** **machine**(): [`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`StateMachineEvent`\<`To`, `From`\>\>

Defined in: [state-machine-types.ts:11](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-types.ts#L11)

##### Returns

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`StateMachineEvent`\<`To`, `From`\>\>
