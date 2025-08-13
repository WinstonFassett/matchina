// Type-level helpers for FactoryMachine ergonomics + a small runtime helper.
// These rely on FactoryMachine exposing `states` and `transitions` on the instance.

export type StatesOf<M> = M extends { states: infer S } ? keyof S & string : never;

export type EventsOf<M, K extends StatesOf<M>> =
  M extends { transitions: infer T }
    ? K extends keyof T
      ? keyof T[K] & string
      : never
    : never;

export type AllEventsOf<M> =
  M extends { transitions: infer T }
    ? keyof T[keyof T & string] & string
    : never;

export type ChildOf<M, K extends StatesOf<M>> =
  M extends { states: infer S }
    ? K extends keyof S
      ? S[K] extends (...a: any[]) => infer D
        ? D extends { machine: infer C }
          ? C
          : never
        : never
      : never
    : never;

// Active events when parent is in state K: prefer child events if present, otherwise parent events.
export type ActiveEvents<M, K extends StatesOf<M>> =
  [ChildOf<M, K>] extends [never]
    ? EventsOf<M, K>
    : AllEventsOf<ChildOf<M, K>> | EventsOf<M, K>;

// sendWhen: narrows event names to ActiveEvents<M, K> given a known parent key K.
export function sendWhen<M extends { send: (t: string, ...p: any[]) => void }, K extends StatesOf<M>, E extends ActiveEvents<M, K>>(
  machine: M,
  _key: K,
  type: E,
  ...params: any[]
) {
  machine.send(type as string, ...params);
}
