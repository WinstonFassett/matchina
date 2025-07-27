---
editUrl: false
next: false
prev: false
title: "MatchboxFactory"
---

> **MatchboxFactory**\<`DataSpecs`, `TagProp`\> = `{ [T in keyof DataSpecs]: DataSpecs[T] extends (args: infer P) => infer _R ? (args: P) => MatchboxMember<T, DataSpecs, TagProp> : () => MatchboxMember<T, DataSpecs, TagProp> }`

Defined in: [matchbox-factory.ts:82](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L82)

MatchboxFactory is the main output type for matchboxFactory.
It maps each tag in DataSpecs to a constructor function for its variant.
If the spec is a function, the constructor accepts its arguments; otherwise, it returns the variant with the value.

## Type Parameters

### DataSpecs

`DataSpecs`

### TagProp

`TagProp` *extends* `string` = `"tag"`
