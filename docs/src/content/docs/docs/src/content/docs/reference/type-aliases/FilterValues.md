---
editUrl: false
next: false
prev: false
title: "FilterValues"
---

> **FilterValues**\<`T`\> = `{ [K in keyof T]: T[K] extends (infer U)[] ? U : T[K] }`

Defined in: [match-filters.ts:11](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/match-filters.ts#L11)

## Type Parameters

### T

`T`
