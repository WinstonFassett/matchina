---
editUrl: false
next: false
prev: false
title: "matchChange"
---

> **matchChange**\<`E`, `Type`, `From`, `To`\>(`changeEvent`, ...`rest`): `changeEvent is E & HasFilterValues<E, { from: { key: From }; to: { key: To }; type: Type }>`

Defined in: [match-change.ts:26](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/match-change.ts#L26)

## Type Parameters

### E

`E` *extends* [`StateChangeEvent`](/docs/src/content/docs/reference/type-aliases/statechangeevent/)

### Type

`Type` *extends* `undefined` \| `string` = [`FlatFilters`](/docs/src/content/docs/reference/type-aliases/flatfilters/)\<[`ChangeEventKeys`](/docs/src/content/docs/reference/type-aliases/changeeventkeys/)\<`E`\>\>\[`"type"`\]

### From

`From` *extends* `undefined` \| `string` = [`FlatFilters`](/docs/src/content/docs/reference/type-aliases/flatfilters/)\<[`ChangeEventKeys`](/docs/src/content/docs/reference/type-aliases/changeeventkeys/)\<`E`\>\>\[`"from"`\]

### To

`To` *extends* `undefined` \| `string` = [`FlatFilters`](/docs/src/content/docs/reference/type-aliases/flatfilters/)\<[`ChangeEventKeys`](/docs/src/content/docs/reference/type-aliases/changeeventkeys/)\<`E`\>\>\[`"to"`\]

## Parameters

### changeEvent

`E`

### rest

\[`Type`, `From`, `To`\] | \[[`FlatFilters`](/docs/src/content/docs/reference/type-aliases/flatfilters/)\<[`ChangeEventKeys`](/docs/src/content/docs/reference/type-aliases/changeeventkeys/)\<`E`\>\> & `object`\]

## Returns

`changeEvent is E & HasFilterValues<E, { from: { key: From }; to: { key: To }; type: Type }>`
