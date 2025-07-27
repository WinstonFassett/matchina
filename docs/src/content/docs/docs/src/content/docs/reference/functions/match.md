---
editUrl: false
next: false
prev: false
title: "match"
---

> **match**\<`C`, `A`, `Exhaustive`\>(`exhaustive`, `casesObj`, `key`, ...`params`): `A`

Defined in: [match-case.ts:3](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/match-case.ts#L3)

## Type Parameters

### C

`C` *extends* [`Cases`](/docs/src/content/docs/reference/type-aliases/cases/)\<`any`, `A`\> & `object` \| `PartialCases`\<`any`, `A`\> \| `Partial`\<[`Cases`](/docs/src/content/docs/reference/type-aliases/cases/)\<`any`, `A`\> & `object`\>

### A

`A`

### Exhaustive

`Exhaustive` *extends* `boolean` = `true`

## Parameters

### exhaustive

`boolean` = `true`

### casesObj

`C`

### key

`string`

### params

...`any`[]

## Returns

`A`
