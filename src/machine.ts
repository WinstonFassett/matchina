import { Expand } from "./utility-types";
import { StateCreators } from "./states";
import {
  TUnionToIntersection,
  TransitionEvent,
  AnyMachine,
  AnEventKey,
} from "./types";
import { UnionDataFactory } from "./unionize";

type SimpleStateTarget<T> = T;
type FunctionStateTarget<State> = (...args: any[]) => State;
type AdvancedFunctionStateTarget<State> = (
  ...args: any[]
) => (event: any) => State;

type ConfigStateTransitionExit<States extends StateCreators<any>> =
  | SimpleStateTarget<keyof States>
  | AdvancedFunctionStateTarget<ReturnType<States[keyof States]>>
  | FunctionStateTarget<ReturnType<States[keyof States]>>;

export type StateTransitionsConfig<States extends StateCreators<any>> = {
  [StateKey in keyof States]: {
    [EventKey: AnEventKey]: ConfigStateTransitionExit<States>;
  };
};

type StateTransitioners<States extends StateCreators<any>, Transitions> = {
  [StateKey in keyof Transitions & keyof States]: {
    [EventKey in keyof Transitions[StateKey]]: Transitions[StateKey][EventKey] extends keyof States
      ? (...args: Parameters<States[Transitions[StateKey][EventKey]]>) => void
      : Transitions[StateKey][EventKey] extends AdvancedFunctionStateTarget<
          ReturnType<States[keyof States]>
        >
      ? (...args: Parameters<Transitions[StateKey][EventKey]>) => void
      : Transitions[StateKey][EventKey] extends FunctionStateTarget<
          ReturnType<States[keyof States]>
        >
      ? (...args: Parameters<Transitions[StateKey][EventKey]>) => void
      : never;
  };
};

type FlattenTransitions<Transitions> = {
  [StateKey in keyof Transitions]: Transitions[StateKey];
}[keyof Transitions];

type TransitionEventKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

// type ExtractedEventKeys<Transitions> = TransitionEventKeys<Transitions>;
type ExtractedEventKeys<
  Transitions extends StateTransitionsConfig<any>,
  States extends StateCreators<any>,
> = {
  [StateKey in keyof StateTransitioners<
    States,
    Transitions
  >]: keyof StateTransitioners<States, Transitions>[StateKey];
}[keyof StateTransitioners<States, Transitions>];

type ExtractedEventParameters<
  Transitions extends StateTransitionsConfig<any>,
  States extends StateCreators<any>,
  EventKey extends ExtractedEventKeys<Transitions, States>,
> = StateTransitioners<States, Transitions>[keyof StateTransitioners<
  States,
  Transitions
>][EventKey] extends (...args: infer P) => any
  ? P
  : never;

export interface MachineEvent<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
  EventKey extends ExtractedEventKeys<Transitions, States> = ExtractedEventKeys<
    Transitions,
    States
  >,
> extends TransitionEvent<
    EventKey,
    ReturnType<States[keyof States]>,
    ReturnType<States[keyof States]>
  > {
  params: ExtractedEventParameters<Transitions, States, EventKey>;
  match: (matchers: EventMatchers<States, Transitions>) => any;
}

type MachineEventDataFactory<
  States extends StateCreators<any>,
  TransitionsConfig extends StateTransitionsConfig<States>,
> = {
  [EventKey in TransitionEventKeys<TransitionsConfig>]: (...args: any[]) => any;
};
type ExhaustiveEventMatchers<
  States extends StateCreators<any>,
  TransitionsConfig extends StateTransitionsConfig<States>,
> = {
  [EventKey in keyof MachineEventDataFactory<
    States,
    TransitionsConfig
  >]: MachineEventDataFactory<
    States,
    TransitionsConfig
  >[EventKey] extends undefined
    ? () => any
    : (
        ...params: Parameters<
          MachineEventDataFactory<States, TransitionsConfig>[EventKey]
        >
      ) => any;
};

type MatchEvent_MUST_handle_all_keys_OR_provide_a_default_handler_using_underscore<
  States extends StateCreators<any>,
  TransitionsConfig extends StateTransitionsConfig<States>,
> = Partial<ExhaustiveEventMatchers<States, TransitionsConfig>> & {
  _: (data: any) => any;
};

export type EventMatchers<
  States extends StateCreators<any>,
  TransitionsConfig extends StateTransitionsConfig<States>,
> =
  | ExhaustiveEventMatchers<States, TransitionsConfig>
  | MatchEvent_MUST_handle_all_keys_OR_provide_a_default_handler_using_underscore<
      States,
      TransitionsConfig
    >;

type MachineEvents<Transitions> = TUnionToIntersection<
  FlattenTransitions<Transitions>
>;

type SendFunction<TransitionConfig extends StateTransitionsConfig<any>> = (
  event: TransitionEventKeys<TransitionConfig>,
  ...args: any[]
) => void;

// Usage within your Machine type
export interface MachineFromStateCreatorsAndTransitionsConfig<
  States extends StateCreators<any>,
  TransitionConfig extends StateTransitionsConfig<States>,
  Event extends MachineEvent<States, TransitionConfig> = MachineEvent<
    States,
    TransitionConfig
  >,
> extends AnyMachine<
    ReturnType<States[keyof States]>,
    TransitionEventKeys<TransitionConfig>,
    Event
  > {
  states: States;
  getState: () => ReturnType<States[keyof States]>;
  transitions: StateTransitioners<States, TransitionConfig>;
  event: Event;
  events: MachineEvents<StateTransitioners<States, TransitionConfig>>;
  send: SendFunction<TransitionConfig>;
  transition: (event: Event) => Event;
  update: (updater: (event: Event) => Event) => void;
  config: { states: States; transitions: TransitionConfig };
}

export type AnyMachineFromStateCreatorsAndTransitionsConfig<
  States extends StateCreators<any> = StateCreators<any>,
  TransitionConfig extends
    StateTransitionsConfig<States> = StateTransitionsConfig<States>,
  Event extends MachineEvent<States, TransitionConfig> = MachineEvent<
    States,
    TransitionConfig
  >,
> = MachineFromStateCreatorsAndTransitionsConfig<
  States,
  TransitionConfig,
  Event
>;

export function createMachine<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
>(
  states: States,
  transitions: Transitions,
): MachineFromStateCreatorsAndTransitionsConfig<States, Transitions> {
  console.log({ states, transitions });
  throw new Error("not implemented yet");
}
