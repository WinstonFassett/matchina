---
editUrl: false
next: false
prev: false
title: "MatchInvocationCases"
---

> **MatchInvocationCases**\<`R`, `A`, `Exhaustive`\> = `Exhaustive` *extends* `true` ? `InvocationCases`\<`R`, `A`\> & `object` \| `PartialInvocationCases`\<`R`, `A`\> : `AnyInvocationCases`\<`R`, `A`\>

Defined in: [match-case-types.ts:28](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/match-case-types.ts#L28)

## Type Parameters

### R

`R` *extends* [`FuncRecord`](/docs/src/content/docs/reference/type-aliases/funcrecord/)

### A

`A`

### Exhaustive

`Exhaustive` *extends* `boolean` = `true`
