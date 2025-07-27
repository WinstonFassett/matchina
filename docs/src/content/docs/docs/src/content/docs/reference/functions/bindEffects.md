---
editUrl: false
next: false
prev: false
title: "bindEffects"
---

> **bindEffects**\<`EffectsConfig`, `Exhaustive`\>(`machine`, `getEffects`, `matchers`, `exhaustive`): () => `void`

Defined in: [extras/bind-effects.ts:5](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/extras/bind-effects.ts#L5)

## Type Parameters

### EffectsConfig

`EffectsConfig` *extends* [`TaggedTypes`](/docs/src/content/docs/reference/type-aliases/taggedtypes/)

### Exhaustive

`Exhaustive` *extends* `boolean` = `false`

## Parameters

### machine

#### effect

(`val`) => `void`

### getEffects

(`state`) => `undefined` \| [`AnyEffect`](/docs/src/content/docs/reference/type-aliases/anyeffect/)[]

### matchers

[`MatchCases`](/docs/src/content/docs/reference/type-aliases/matchcases/)\<`EffectsConfig`, `any`, `Exhaustive`\>

### exhaustive

`Exhaustive` = `...`

## Returns

> (): `void`

### Returns

`void`
