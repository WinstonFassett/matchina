---
editUrl: false
next: false
prev: false
title: "MatchboxApi"
---

Defined in: [matchbox-factory.ts:65](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L65)

MatchboxApi provides type-safe methods for working with Matchbox instances:
- is: Type predicate for narrowing to a specific variant.
- as: Casts to a specific variant, throws if the tag does not match.
- match: Pattern matching for variant data.

## Type Parameters

### TagProp

`TagProp` *extends* `string`

The property name used for the tag.

### F

`F` *extends* `TagDataCreators`

The factory shape.

## Properties

### as()

> **as**: \<`K`\>(`key`) => `Matchbox`\<`TagProp`, `F`, `K`\>

Defined in: [matchbox-factory.ts:70](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L70)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### key

`K`

#### Returns

`Matchbox`\<`TagProp`, `F`, `K`\>

***

### is()

> **is**: \<`K`\>(`key`) => `this is Matchbox<TagProp, F, K, string & keyof F>`

Defined in: [matchbox-factory.ts:69](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L69)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### key

`K`

#### Returns

`this is Matchbox<TagProp, F, K, string & keyof F>`

***

### match()

> **match**: \<`A`, `Exhaustive`\>(`cases`, `exhaustive?`) => `A`

Defined in: [matchbox-factory.ts:71](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L71)

#### Type Parameters

##### A

`A`

##### Exhaustive

`Exhaustive` *extends* `boolean` = `true`

#### Parameters

##### cases

\{ \[K in string \| number \| symbol\]: (data: ReturnType\<F\[K\]\>) =\> A \}

##### exhaustive?

`Exhaustive`

#### Returns

`A`
