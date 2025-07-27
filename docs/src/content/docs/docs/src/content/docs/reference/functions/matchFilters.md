---
editUrl: false
next: false
prev: false
title: "matchFilters"
---

> **matchFilters**\<`T`, `C`\>(`item`, `condition`): `item is T & HasFilterValues<T, C>`

Defined in: [match-filters.ts:23](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/match-filters.ts#L23)

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `any`\>

### C

`C` *extends* [`NestableFilters`](/docs/src/content/docs/reference/type-aliases/nestablefilters/)\<`T`\>

## Parameters

### item

`T`

### condition

`C`

## Returns

`item is T & HasFilterValues<T, C>`
