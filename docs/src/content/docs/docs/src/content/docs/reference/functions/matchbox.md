---
editUrl: false
next: false
prev: false
title: "matchbox"
---

> **matchbox**\<`DataSpecs`, `Tag`, `TagProp`\>(`tag`, `data`, `tagProp`): [`MatchboxMember`](/docs/src/content/docs/reference/type-aliases/matchboxmember/)\<`Tag`, `DataSpecs`, `TagProp`\>

Defined in: [matchbox-factory.ts:196](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L196)

matchbox creates a single Matchbox variant instance.

## Type Parameters

### DataSpecs

`DataSpecs`

### Tag

`Tag` *extends* `string` \| `number` \| `symbol`

### TagProp

`TagProp` *extends* `string` = `"tag"`

## Parameters

### tag

`Tag`

The tag value for the variant.

### data

`any`

The data associated with the variant.

### tagProp

`TagProp` = `...`

The property name used for the tag (default: "tag").

## Returns

[`MatchboxMember`](/docs/src/content/docs/reference/type-aliases/matchboxmember/)\<`Tag`, `DataSpecs`, `TagProp`\>

A Matchbox instance with type-safe API methods.
