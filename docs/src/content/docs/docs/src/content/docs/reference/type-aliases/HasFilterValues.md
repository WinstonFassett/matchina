---
editUrl: false
next: false
prev: false
title: "HasFilterValues"
---

> **HasFilterValues**\<`T`, `C`\> = `T` *extends* `T` ? `{ [K in keyof T & keyof C]: T[K] extends C[K] ? true : false }` *extends* `Record`\<keyof `C`, `true`\> ? `T` : `never` : `never`

Defined in: [match-filters.ts:15](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/match-filters.ts#L15)

## Type Parameters

### T

`T`

### C

`C`
