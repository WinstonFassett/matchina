---
editUrl: false
next: false
prev: false
title: "MatchboxData"
---

> **MatchboxData**\<`DataSpecs`\> = `{ [T in keyof DataSpecs]: DataSpecs[T] extends (args: any[]) => any ? ReturnType<DataSpecs[T]> : DataSpecs[T] }`

Defined in: [matchbox-factory.ts:144](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L144)

MatchboxData maps each tag in DataSpecs to its corresponding value type.
If the spec is a function, uses its return type; otherwise, uses the value type directly.

Used for pattern matching and type inference in MatchboxMember and related APIs.

## Type Parameters

### DataSpecs

`DataSpecs`
