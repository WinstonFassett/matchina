---
editUrl: false
next: false
prev: false
title: "createTransitionMachine"
---

> **createTransitionMachine**\<`E`\>(`transitions`, `initialState`): [`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\> & [`TransitionContext`](/docs/src/content/docs/reference/interfaces/transitioncontext/)

Defined in: [transition-machine.ts:19](https://github.com/WinstonFassett/matchina/blob/2d22b2187dda803854f54b63fe09d04bd833387d/src/transition-machine.ts#L19)

## Type Parameters

### E

`E` *extends* [`StateMachineEvent`](/docs/src/content/docs/reference/interfaces/statemachineevent/)\<[`State`](/docs/src/content/docs/reference/interfaces/state/), [`State`](/docs/src/content/docs/reference/interfaces/state/)\>

## Parameters

### transitions

[`TransitionRecord`](/docs/src/content/docs/reference/type-aliases/transitionrecord/)

### initialState

`E`\[`"from"`\]

## Returns

[`StateMachine`](/docs/src/content/docs/reference/interfaces/statemachine/)\<`E`\> & [`TransitionContext`](/docs/src/content/docs/reference/interfaces/transitioncontext/)
