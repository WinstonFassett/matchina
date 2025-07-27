---
editUrl: false
next: false
prev: false
title: "whenEvent"
---

> **whenEvent**\<`E`, `F`, `FV`\>(`filter`, `fn`): (`ev`) => `void`

Defined in: [factory-machine-hooks.ts:110](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/factory-machine-hooks.ts#L110)

## Type Parameters

### E

`E` *extends* [`FactoryMachineEvent`](/docs/src/content/docs/reference/type-aliases/factorymachineevent/)\<`any`\>

### F

`F` *extends* [`FlatFilters`](/docs/src/content/docs/reference/type-aliases/flatfilters/)\<[`ChangeEventKeys`](/docs/src/content/docs/reference/type-aliases/changeeventkeys/)\<`E`\>\> = [`FlatFilters`](/docs/src/content/docs/reference/type-aliases/flatfilters/)\<[`ChangeEventKeys`](/docs/src/content/docs/reference/type-aliases/changeeventkeys/)\<`E`\>\>

### FV

`FV` *extends* [`FilterValues`](/docs/src/content/docs/reference/type-aliases/filtervalues/)\<`F`\> = [`FilterValues`](/docs/src/content/docs/reference/type-aliases/filtervalues/)\<`F`\>

## Parameters

### filter

`F`

### fn

(`ev`) => `any`

## Returns

> (`ev`): `void`

### Parameters

#### ev

`E`

### Returns

`void`
