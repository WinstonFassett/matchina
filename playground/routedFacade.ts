import { AllEventsOf, ChildOf, StatesOf } from "./types";

// RoutedEventsOf<M>: parent events unioned with all child events across parent states
export type RoutedEventsOf<M> =
  AllEventsOf<M> |
  (
    StatesOf<M> extends infer K
      ? K extends StatesOf<M>
        ? AllEventsOf<ChildOf<M, K>>
        : never
      : never
  );

// A zero-runtime typed facade that widens `send` to RoutedEventsOf<M>.
export function routedFacade<M extends { send: (...a: any[]) => any }>(machine: M) {
  return {
    ...machine,
    send: ((type: RoutedEventsOf<M>, ...params: any[]) => {
      (machine.send as any)(type as any, ...params);
    }) as (type: RoutedEventsOf<M>, ...params: any[]) => void,
  } as const;
}
