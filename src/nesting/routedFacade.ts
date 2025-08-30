import { AllEventsOf, ChildOf, StatesOf } from "../../playground/types";

// RoutedEventsOf<M>: parent events unioned with all child events across parent states
export type RoutedEventsOf<M> =
  | AllEventsOf<M>
  | {
      [K in StatesOf<M>]: AllEventsOf<ChildOf<M, K>>
    }[StatesOf<M>];

// A zero-runtime typed facade that widens `send` to RoutedEventsOf<M>.
export function routedFacade<M extends { send: (...a: any[]) => any }>(machine: M) {
  return {
    ...machine,
    send: ((type: RoutedEventsOf<M>, ...params: any[]) => {
      (machine.send as any)(type as any, ...params);
    }) as (type: RoutedEventsOf<M>, ...params: any[]) => void,
  } as const;
}
