---
editUrl: false
next: false
prev: false
title: "MatchboxMember"
---

> **MatchboxMember**\<`Tag`, `DataSpecs`, `TagProp`\> = `DataSpecs`\[`Tag`\] *extends* (...`args`) => `any` ? `object` : `object` & `{ [_ in TagProp]: Tag }` & [`MatchboxMemberApi`](/docs/src/content/docs/reference/interfaces/matchboxmemberapi/)\<`DataSpecs`, `TagProp`\>

Defined in: [matchbox-factory.ts:92](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L92)

MatchboxMember creates the type for a single Matchbox variant instance from its data specification.
Includes the data, tag property, and member extension methods (is, as, match).

## Type Parameters

### Tag

`Tag` *extends* keyof `DataSpecs`

### DataSpecs

`DataSpecs`

### TagProp

`TagProp` *extends* `string`
