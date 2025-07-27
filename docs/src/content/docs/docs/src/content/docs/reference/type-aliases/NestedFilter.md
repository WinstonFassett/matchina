---
editUrl: false
next: false
prev: false
title: "NestedFilter"
---

> **NestedFilter**\<`T`\> = `{ [K in keyof T]?: T[K] extends Record<string, any> ? NestableFilters<T[K]> : SingleValueFilter<T, K> }`

Defined in: [match-filters.ts:5](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/match-filters.ts#L5)

## Type Parameters

### T

`T`
