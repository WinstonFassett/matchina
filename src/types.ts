export type AStateKey = string | number | symbol;
export type AnEventKey = string | number | symbol;

// interface ContextualEvent<S, C> {
//   source?: S;
//   context?: C;
// }
export interface TransitionEvent<Event, From, To> {
  event: Event;
  from: From;
  to: To;
}

export interface AnyMachine<
  State = any,
  EventKey extends AnEventKey = AnEventKey,
  Event extends TransitionEvent<EventKey, State, State> = TransitionEvent<
    EventKey,
    State,
    State
  >,
> {
  event: Event;
  getState: () => State;
  send: (event: EventKey, data?: any) => void;
  update: (updater: (event: Event) => Event) => void;
  transition: (event: Event) => Event;
}

export type TUnionToIntersection<T> = (
  T extends any ? (x: T) => any : never
) extends (x: infer R) => any
  ? R
  : never;
