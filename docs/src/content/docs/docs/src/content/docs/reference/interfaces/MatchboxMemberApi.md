---
editUrl: false
next: false
prev: false
title: "MatchboxMemberApi"
---

Defined in: [matchbox-factory.ts:127](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L127)

MatchboxMemberApi provides type-safe methods for working with a Matchbox member:
- is: Type predicate for narrowing to a specific variant.
- as: Casts to a specific variant, throws if the tag does not match.
- match: Pattern matching for variant data.

The match method is defined inline for clarity and simplicity.

## Type Parameters

### DataSpecs

`DataSpecs`

### TagProp

`TagProp` *extends* `string`

## Properties

### as()

> **as**: \<`T`\>(`key`) => [`MatchboxMember`](/docs/src/content/docs/reference/type-aliases/matchboxmember/)\<`T`, `DataSpecs`, `TagProp`\>

Defined in: [matchbox-factory.ts:131](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L131)

#### Type Parameters

##### T

`T` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### key

`T`

#### Returns

[`MatchboxMember`](/docs/src/content/docs/reference/type-aliases/matchboxmember/)\<`T`, `DataSpecs`, `TagProp`\>

***

### is()

> **is**: \<`T`\>(`key`) => `this is MatchboxMember<T, DataSpecs, TagProp>`

Defined in: [matchbox-factory.ts:128](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L128)

#### Type Parameters

##### T

`T` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### key

`T`

#### Returns

`this is MatchboxMember<T, DataSpecs, TagProp>`

## Methods

### match()

#### Call Signature

> **match**\<`A`\>(`cases`, `exhaustive?`): `A`

Defined in: [matchbox-factory.ts:134](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L134)

##### Type Parameters

###### A

`A`

##### Parameters

###### cases

`MatchCases`\<`DataSpecs`, `A`, `true`\>

###### exhaustive?

`boolean`

##### Returns

`A`

#### Call Signature

> **match**\<`A`\>(`cases`, `exhaustive`): `A`

Defined in: [matchbox-factory.ts:135](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L135)

##### Type Parameters

###### A

`A`

##### Parameters

###### cases

`MatchCases`\<`DataSpecs`, `A`, `false`\>

###### exhaustive

`boolean`

##### Returns

`A`
