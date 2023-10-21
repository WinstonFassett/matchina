
// interface ContextualEvent<S, C> {
//   source?: S;
//   context?: C;
// }

// #region draft/unused util-types

import { StateTransitionsConfig, StateTransitioners, ExtractedEventKeys } from "./machine-types";
import { StateCreators } from "./states";

export type TransitionExitState<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
> = StateTransitioners<States, Transitions>[keyof StateTransitioners<
  States,
  Transitions
>];

export type ExtractedEventParameters<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
  EventKey extends ExtractedEventKeys<States, Transitions>,
> = StateTransitioners<States, Transitions>[keyof StateTransitioners<
  States,
  Transitions
>][EventKey] extends (...args: infer P) => any
  ? P
  : never;

export type ExtractedEventExit<
  Transitions extends StateTransitionsConfig<any>,
  States extends StateCreators<any>,
  EventKey extends ExtractedEventKeys<States, Transitions>,
> = StateTransitioners<States, Transitions>[keyof StateTransitioners<
  States,
  Transitions
>][EventKey] extends (...args: any) => infer R
  ? R
  : never;

// #endregion
