---
editUrl: false
next: false
prev: false
title: "matchboxFactory"
---

> **matchboxFactory**\<`Config`, `TagProp`, `R`\>(`config`, `tagProp`): `R`

Defined in: [matchbox-factory.ts:154](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L154)

Create a tagged union from a record mapping tags to value types, along with associated
variant constructors, type predicates and `match` function.

## Type Parameters

### Config

`Config` *extends* `string` \| [`TaggedTypes`](/docs/src/content/docs/reference/type-aliases/taggedtypes/)\<`any`\>

### TagProp

`TagProp` *extends* `string` = `"tag"`

### R

`R` = [`MatchboxFactory`](/docs/src/content/docs/reference/type-aliases/matchboxfactory/)\<`Config` *extends* readonly `string`[] ? `{ [K in string]: (data: any) => any }` : `Config`, `TagProp`\>

## Parameters

### config

`Config`

### tagProp

`TagProp` = `...`

## Returns

`R`
