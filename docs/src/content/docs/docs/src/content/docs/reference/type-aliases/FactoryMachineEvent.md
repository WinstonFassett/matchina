---
editUrl: false
next: false
prev: false
title: "FactoryMachineEvent"
---

> **FactoryMachineEvent**\<`FC`\> = `{ [K in keyof FC["transitions"]]: { [E in keyof FC["transitions"][K]]: FactoryMachineTransitionEvent<FC, K, E> }[keyof FC["transitions"][K]] }`\[keyof `FC`\[`"transitions"`\]\]

Defined in: [factory-machine-types.ts:49](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-types.ts#L49)

## Type Parameters

### FC

`FC` *extends* [`FactoryMachineContext`](/docs/src/content/docs/reference/interfaces/factorymachinecontext/)\<`any`\>
