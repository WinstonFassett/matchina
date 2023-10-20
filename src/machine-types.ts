import { StateCreators } from "./states";
import {
  TUnionToIntersection,
  TransitionEvent,
  AnyMachine,
  AnEventKey,
} from "./types";
import { Expand } from "./utility-types";

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
export type StateTransitioners<States extends StateCreators<any>, Transitions> = {
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

type ExtractedEventKeys<
States extends StateCreators<any>,
Transitions extends StateTransitionsConfig<States>,
> = {
  [StateKey in keyof StateTransitioners<
    States,
    Transitions
  >]: keyof StateTransitioners<States, Transitions>[StateKey];
}[keyof StateTransitioners<States, Transitions>];

export type TransitionExitState<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
  EventKey extends ExtractedEventKeys<States, Transitions>
>
 = StateTransitioners<States, Transitions>[keyof StateTransitioners<
  States,
  Transitions
>]

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

type ExtractedEventExit<
  Transitions extends StateTransitionsConfig<any>,
  States extends StateCreators<any>,
  EventKey extends ExtractedEventKeys<States, Transitions>,
> = StateTransitioners<States, Transitions>[keyof StateTransitioners<
  States,
  Transitions
>][EventKey] extends (...args: any) => infer R
  ? R
  : never;  

export type MachineEvent<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
  EventKey extends ExtractedEventKeys<States, Transitions> = ExtractedEventKeys<States, Transitions>,
  From extends ReturnType<States[keyof States]> = ReturnType<States[keyof States]>,
  To extends ReturnType<States[keyof States]> = ReturnType<States[keyof States]>,
  Params extends any = any
  // TO should use event key plus transition
> = Expand<TransitionEvent<
    EventKey,
    From,
    To
  > & {
  params: Params;
  match: <M extends EventMatchers<States, Transitions>>(cases: M) => 
    M[keyof M] extends (...args: any) => infer R ? R : never;
}>

type TransitionEventMatchers<
  States extends StateCreators<any>,
  TransitionsConfig extends StateTransitionsConfig<States>,
> = {
  [StateKey in keyof TransitionsConfig]?: 
    {
      [EventKey in keyof TransitionsConfig[StateKey]]: 
        TransitionsConfig[StateKey][EventKey] extends keyof States ?
      (
        ...args: Parameters<States[TransitionsConfig[StateKey][EventKey]]>
      ) => any
      : (...args: any[]) => any;
    }
  
}[keyof TransitionsConfig] & {
  _?: (...args:any[]) => any
};

type EventMatchers<
States extends StateCreators<any>,
TransitionsConfig extends StateTransitionsConfig<States>,
> = TransitionEventMatchers<States, TransitionsConfig>
    
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
  config: { states: States; transitions: TransitionConfig };
  states: States;
  events: MachineEvents<StateTransitioners<States, TransitionConfig>>;
  transitions: StateTransitioners<States, TransitionConfig>;
  getState: () => ReturnType<States[keyof States]>;
  getLast: () => Event;
  send: SendFunction<TransitionConfig>;
  transition: (
    event: TransitionEventKeys<TransitionConfig>,
    data?: any,
  ) => Event | undefined;
  update: (updater: (event: Event) => Event) => void;
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
export type MachineDefinition<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
> = {
  create: MachineCreator<States, Transitions>;
  states: States;
  transitions: Transitions;
};
type MachineCreator<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
> = (
  initialState: ReturnType<States[keyof States]>,
) => MachineFromStateCreatorsAndTransitionsConfig<States, Transitions>;
