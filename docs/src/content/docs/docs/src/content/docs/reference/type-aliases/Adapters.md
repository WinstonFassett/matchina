---
editUrl: false
next: false
prev: false
title: "Adapters"
---

> **Adapters**\<`E`\> = `object` & `object`

Defined in: [state-machine-hooks.ts:17](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/state-machine-hooks.ts#L17)

## Type declaration

### after

> **after**: `Transform`\<[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E`\>, [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E`\>\>\>

### before()

> **before**: (`abortware`) => [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<`Transform`\<`E`\>\>

#### Parameters

##### abortware

[`AbortableEventHandler`](/docs/src/content/docs/reference/type-aliases/abortableeventhandler/)\<`E`\>

#### Returns

[`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<`Transform`\<`E`\>\>

### effect

> **effect**: `Transform`\<[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E`\>, [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E`\>\>\>

### enter

> **enter**: `Transform`\<[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E`\>, [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E`\>\>\>

### guard()

> **guard**: (`guardFn`) => [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"guard"`\]\>

#### Parameters

##### guardFn

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"guard"`\]

#### Returns

[`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"guard"`\]\>

### handle()

> **handle**: (`handleFn`) => [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"handle"`\]\>

#### Parameters

##### handleFn

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"handle"`\]

#### Returns

[`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"handle"`\]\>

### leave

> **leave**: `Transform`\<[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E`\>, [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E`\>\>\>

### notify

> **notify**: `Transform`\<[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E`\>, [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`Effect`](/docs/src/content/docs/reference/type-aliases/effect/)\<`E`\>\>\>

### resolveExit()

> **resolveExit**: \<`F`\>(`resolveFn`) => [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<`F`\>

#### Type Parameters

##### F

`F` *extends* [`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"resolveExit"`\]

#### Parameters

##### resolveFn

`F`

#### Returns

[`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<`F`\>

### transition()

> **transition**: (`middleware`) => [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"transition"`\]\>

#### Parameters

##### middleware

[`Middleware`](/docs/src/content/docs/reference/type-aliases/middleware/)\<`E`\>

#### Returns

[`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"transition"`\]\>

### update()

> **update**: (`middleware`) => [`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"update"`\]\>

#### Parameters

##### middleware

[`Middleware`](/docs/src/content/docs/reference/type-aliases/middleware/)\<`E`\>

#### Returns

[`Funcware`](/docs/src/content/docs/reference/type-aliases/funcware/)\<[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\>\[`"update"`\]\>

## Type Parameters

### E

`E` *extends* [`StateMachineEvent`](/docs/src/content/docs/reference/interfaces/statemachineevent/) = [`StateMachineEvent`](/docs/src/content/docs/reference/interfaces/statemachineevent/)
