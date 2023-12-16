import { AbortableEventHandler, Funcware } from "./ext";
import {
  AnyFactoryMachineEvent,
  AnyFactoryState,
  FactoryEvent,
  FactoryEventResolved,
  FactoryMachineContext,
  FlatEventKeys,
} from "./factory-machine";
import { FlatFilters, HasFilterValues } from "./match-property-filters";
import { StateMachine, StateMachineEvent } from "./state-machine";
import { Effect, Middleware } from "./types";
import {
  FlatMemberUnion,
  Members,
  TUnionToIntersection,
} from "./utility-types";

export type TransitionHookExtensions<E extends StateMachineEvent> = {
  begin: AbortableEventHandler<E>;
  resolve: Funcware<(ev: Partial<E>) => E>;
  transition: AbortableEventHandler<E>;
  guard: StateMachine<E>["guard"];
  handle: StateMachine<E>["handle"];
  before: AbortableEventHandler<E>;
  effect: Effect<E>;
  leave: Effect<E>;
  enter: Effect<E>;
  notify: Effect<E>;
  after: Effect<E>;
  end: Effect<E>;
};

export type TransitionHookConfig<E extends StateMachineEvent<any, any>> =
  FlatFilters<TransitionHookExtensions<E>>;

export type StateTransitionHooks<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC["transitions"] | "*",
> = {
  leave: Middleware<
    // FactoryEventResolved<FC, StateKey>
    HasFilterValues<
      FactoryEvent<FC>,
      {
        from: { key: StateKey extends keyof FC["states"] ? StateKey : keyof FC["states"] };
      }
    >
    // AnyFactoryMachineEvent<FC> & {
    //   from: AnyFactoryState<
    //     FC["states"],
    //     StateKey extends keyof FC["states"] ? StateKey : keyof FC["states"]
    //   >;
    // }
  >;
  enter: Middleware<
    // FactoryEventResolved<FC, any, any, FactoryEvent<FC>['to']>
    HasFilterValues<
      FactoryEvent<FC>,
      {
        to: { key: StateKey extends keyof FC["states"] ? StateKey : keyof FC["states"] };
      }
    >
    // AnyFactoryMachineEvent<FC> & {
    //   to: AnyFactoryState<
    //     FC["states"],
    //     StateKey extends keyof FC["states"] ? StateKey : keyof FC["states"]
    //   >;
    // }
  >;
};

export type StateTransitionHookConfig<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC["transitions"] | "*",
> = FlatFilters<StateTransitionHooks<FC, StateKey>>;

type On1<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC["transitions"] | "*",
  Transitions extends FC["transitions"] = FC["transitions"],
  States extends FC["states"] = FC["states"],
> =
  // regular state
  StateKey extends keyof States
    ? // specific state
      {
        [Event in
          | keyof Transitions[StateKey]
          | "*"]?: 
          Event extends FlatFactoryEventKeys<FC> // specific event
          ? 
          // ? FactoryEventResolved<FC, StateKey, Event extends '*' ? any : Event>
            FactoryEventResolved<FC, StateKey, Event>['to'] extends AnyFactoryState<States>
            ? TransitionHookConfig<
                FactoryEventResolved<FC, StateKey, Event>
              >
            : never
          : // wildcard event
            TransitionHookConfig<
              FactoryEventResolved<FC, StateKey>
            >;
      }
    : // wildcard state
      {
        [Event in
          | FlatFactoryEventKeys<FC>
          | "*"]?: TransitionHookConfig<
          Event extends '*' ? FactoryEvent<FC> : FactoryEventResolved<FC, any, Event>
        >;
      };

type On<
  FC extends FactoryMachineContext,
  FromStateKey extends keyof FC["transitions"],   
> =
{
  [Event in keyof FC['transitions'][FromStateKey] | "*"]?: 
    TransitionHookConfig<
      // Event extends keyof FC["transitions"][FromStateKey] ? FactoryEventResolved<FC, FromStateKey, Event> : FactoryEvent<FC>
      HasFilterValues<
        FactoryEvent<FC>,
        {
          type: Event extends '*' ? any : Event;
          from: { key: FromStateKey }          
        }
      >
      // FactoryEventResolved<FC, FromStateKey, Event extends '*' ? any : Event>
    >
};

export type FlatExitStates<
  FC extends FactoryMachineContext,
  States extends FC["states"] = FC["states"],
> = Members<{
  [StateKey in keyof FC['transitions']]: {
    [EventKey in keyof FC['transitions'][StateKey]]: FC['transitions'][StateKey][EventKey] extends (
      ...args: any[]
    ) => infer TargetState
      ? TargetState extends AnyFactoryState<States, infer TargetStateKey>
        ? TargetStateKey extends keyof States
          ? TargetState
          : never
        : never
      : never;
  }[keyof FC['transitions'][StateKey]];
}>;

export type EventExitStatesIntersection<FC extends FactoryMachineContext> =
  TUnionToIntersection<FlatMemberUnion<StatesToEventsToStates<FC>>>;

export type StatesToEventsToStates<FC extends FactoryMachineContext> = {
  [StateKey in keyof FC['transitions']]: {
    [EventKey in keyof FC['transitions'][StateKey]]: FactoryEventResolved<FC, StateKey, EventKey>['to']
  };
};

export type StateEventHookConfig<FC extends FactoryMachineContext> = {
  [StateKey in string & (keyof FC["transitions"] | "*")]?: {
    on?: On<FC, StateKey extends '*' ? keyof FC["transitions"] : StateKey>;
  } & StateTransitionHookConfig<FC, StateKey>;
};

export type FlatFactoryEventKeys<FC extends FactoryMachineContext> = string &
  {
    [StateKey in keyof FC['transitions']]: keyof FC['transitions'][StateKey];
  }[keyof FC['transitions']];
