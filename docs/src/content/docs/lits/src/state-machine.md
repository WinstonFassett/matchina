---
title: "state-machine"
description: "Add description here"
---


```ts
export interface State {
  key: string;
}

export interface StateMachineEvent<
  To extends State = State,
  From extends State = To,
> {
  type: string;
  params: any[];
  to: To;
  from: From;
  get machine(): StateMachine<StateMachineEvent<To, From>>;
}

// When resolving, "to" is not known
export type ResolveEvent<C> = Omit<C, "to">;

export interface StateMachine<E extends StateMachineEvent = StateMachineEvent> {
  getState(): E["to"] | E["from"];
  getChange(): E;
  send: (type: E["type"], ...params: E["params"]) => void;
  resolveExit(ev: ResolveEvent<E>): E | undefined;
  transition(change: E): void;
  guard(ev: E): boolean;
  handle(ev: E): E | undefined;
  before(ev: E): E | undefined;
  update(ev: E): void;
  effect(ev: E): void;
  leave(ev: E): void;
  enter(ev: E): void;
  notify(ev: E): void;
  after(ev: E): void;
}
```
