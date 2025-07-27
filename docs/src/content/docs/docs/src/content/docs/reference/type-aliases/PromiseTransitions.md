---
editUrl: false
next: false
prev: false
title: "PromiseTransitions"
---

> **PromiseTransitions** = `object`

Defined in: [promise-machine.ts:26](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/promise-machine.ts#L26)

## Properties

### Idle

> `readonly` **Idle**: `object`

Defined in: [promise-machine.ts:27](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/promise-machine.ts#L27)

#### executing

> `readonly` **executing**: `"Pending"`

***

### Pending

> `readonly` **Pending**: `object`

Defined in: [promise-machine.ts:30](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/promise-machine.ts#L30)

#### reject

> `readonly` **reject**: `"Rejected"`

#### resolve

> `readonly` **resolve**: `"Resolved"`
