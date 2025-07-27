---
editUrl: false
next: false
prev: false
title: "KeysWithZeroRequiredArgs"
---

> **KeysWithZeroRequiredArgs**\<`T`\> = \{ \[K in keyof T\]: T\[K\] extends (args: infer Args) =\> any ? Args extends \[\] \| \[undefined?\] ? K : never : never \}\[keyof `T`\]

Defined in: [utility-types.ts:33](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/utility-types.ts#L33)

## Type Parameters

### T

`T`
