---
editUrl: false
next: false
prev: false
title: "PromiseStateCreators"
---

> **PromiseStateCreators**\<`F`, `E`\> = `object`

Defined in: [promise-machine.ts:5](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/promise-machine.ts#L5)

## Type Parameters

### F

`F` *extends* [`PromiseCallback`](/docs/src/content/docs/reference/type-aliases/promisecallback/)

### E

`E`

## Properties

### Idle

> **Idle**: `undefined`

Defined in: [promise-machine.ts:6](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/promise-machine.ts#L6)

***

### Pending()

> **Pending**: (`promise`, `params`) => `object`

Defined in: [promise-machine.ts:7](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/promise-machine.ts#L7)

#### Parameters

##### promise

`Promise`\<`Awaited`\<`ReturnType`\<`F`\>\>\>

##### params

`Parameters`\<`F`\>

#### Returns

`object`

##### params

> **params**: `Parameters`\<`F`\>

##### promise

> **promise**: `Promise`\<`Awaited`\<`ReturnType`\<`F`\>\>\>

***

### Rejected()

> **Rejected**: (`error`) => `E`

Defined in: [promise-machine.ts:11](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/promise-machine.ts#L11)

#### Parameters

##### error

`E`

#### Returns

`E`

***

### Resolved()

> **Resolved**: (`data`) => `Awaited`\<`ReturnType`\<`F`\>\>

Defined in: [promise-machine.ts:12](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/promise-machine.ts#L12)

#### Parameters

##### data

`Awaited`\<`ReturnType`\<`F`\>\>

#### Returns

`Awaited`\<`ReturnType`\<`F`\>\>
