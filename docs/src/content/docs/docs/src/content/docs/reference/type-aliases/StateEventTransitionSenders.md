---
editUrl: false
next: false
prev: false
title: "StateEventTransitionSenders"
---

> **StateEventTransitionSenders**\<`FC`, `K`\> = `{ [StateKey in K]: { [EventKey in keyof FC["transitions"][StateKey]]: (args: FactoryMachineTransitionEvent<FC, StateKey, EventKey>["params"]) => void } }`

Defined in: [factory-machine-event-api.ts:60](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-event-api.ts#L60)

## Type Parameters

### FC

`FC` *extends* [`FactoryMachineContext`](/docs/src/content/docs/reference/interfaces/factorymachinecontext/)

### K

`K` *extends* keyof `FC`\[`"transitions"`\] = keyof `FC`\[`"transitions"`\]
