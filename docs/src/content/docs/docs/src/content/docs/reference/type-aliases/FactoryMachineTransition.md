---
editUrl: false
next: false
prev: false
title: "FactoryMachineTransition"
---

> **FactoryMachineTransition**\<`SF`, `FromStateKey`, `EventKey`\> = keyof `SF` \| (...`params`) => [`FactoryState`](/docs/src/content/docs/reference/type-aliases/factorystate/)\<`SF`\> \| (...`params`) => (`ev`) => [`FactoryState`](/docs/src/content/docs/reference/type-aliases/factorystate/)\<`SF`\>

Defined in: [factory-machine-types.ts:33](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-types.ts#L33)

## Type Parameters

### SF

`SF` *extends* [`StateFactory`](/docs/src/content/docs/reference/type-aliases/statefactory/)

### FromStateKey

`FromStateKey` *extends* keyof `SF` = keyof `SF`

### EventKey

`EventKey` *extends* `string` = `any`
