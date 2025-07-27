---
editUrl: false
next: false
prev: false
title: "FactoryMachineTransitions"
---

> **FactoryMachineTransitions**\<`SF`\> = `{ [FromStateKey in keyof SF]?: { [EventKey in string]?: FactoryMachineTransition<SF, FromStateKey, EventKey> } }`

Defined in: [factory-machine-types.ts:27](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-types.ts#L27)

## Type Parameters

### SF

`SF` *extends* [`StateFactory`](/docs/src/content/docs/reference/type-aliases/statefactory/)
