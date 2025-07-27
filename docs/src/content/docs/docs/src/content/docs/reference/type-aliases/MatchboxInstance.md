---
editUrl: false
next: false
prev: false
title: "MatchboxInstance"
---

> **MatchboxInstance**\<`TagProp`, `Tag`, `Data`\> = `object` & `{ [_ in TagProp]: Tag }`

Defined in: [matchbox-factory.ts:45](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/matchbox-factory.ts#L45)

MatchboxInstance is the shape of a single Matchbox variant instance.
Contains the data and tag, plus a getter for the tag property.

## Type declaration

### data

> **data**: `Data`

### getTag()

> **getTag**: () => `Tag`

#### Returns

`Tag`

## Type Parameters

### TagProp

`TagProp` *extends* `string`

The property name used for the tag.

### Tag

`Tag` *extends* `string`

The tag value.

### Data

`Data`

The data associated with this variant.
