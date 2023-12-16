import { AbortableEventHandler, Funcware } from "./ext";
import {
  AnyFactoryMachineEvent,
  AnyFactoryState,
  FactoryEvent,
  FactoryEventResolved,
  FactoryMachineContext,
  FlatEventKeys,
  StateFromFactory,
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
    StateKey extends "*"
    ? FactoryEvent<FC>
    : HasFilterValues<
      FactoryEvent<FC>,
      {
        from: { key: StateKey extends keyof FC["states"] ? StateKey : keyof FC["states"] };
      }
    >
  >;
  enter: Middleware<
    StateKey extends "*" 
    ? FactoryEvent<FC>
    :
    HasFilterValues<
      FactoryEvent<FC>,
      {
        to: { key: StateKey extends keyof FC["states"] ? StateKey : keyof FC["states"] };
      }
    >
  >;
};

export type StateTransitionHookConfig<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC["transitions"] | "*",
> = FlatFilters<StateTransitionHooks<FC, StateKey>>;

type EventKeys<
  FC extends FactoryMachineContext, 
  FromStateKey extends keyof FC["transitions"] | '*'
>
= 
FromStateKey extends keyof FC["transitions"] ?
keyof FC['transitions'][FromStateKey]
: FlatEventKeys<FC>
;

type On<
  FC extends FactoryMachineContext,
  FromStateKey extends keyof FC["transitions"] | '*',   
> =
{
  [Event in EventKeys<FC, FromStateKey> | '*']?: 
    TransitionHookConfig<
      FactoryEvent<FC> & 
      (
        Event extends '*' ? 
          FromStateKey extends FactoryEvent<FC>['from']['key']
          ? FactoryEventResolved<FC, FromStateKey>
          : FactoryEvent<FC>
          // HasFilterValues<
          //   FactoryEvent<FC>,
          //   {
          //     from: FromStateKey extends keyof FC['states'] ? { key: FromStateKey } : any;
          //     // from: FromStateKey extends keyof FC["states"] ? StateFromFactory<FC['states'], FromStateKey> : any;
          //     // from: StateFromFactory<FC["states"], FromStateKey extends keyof FC['states'] ? FromStateKey : keyof FC['states']>;
          //     // type: Event extends FactoryEvent<FC>['type'] ? Event : FactoryEvent<FC>['type'];
          //   }
          // >        
        :
        { wtf: true } &
        HasFilterValues<
          FactoryEvent<FC>,
          {
            from: StateFromFactory<FC["states"], FromStateKey extends keyof FC['states'] ? FromStateKey : any>;
            type: Event extends FactoryEvent<FC>['type'] ? Event : FactoryEvent<FC>['type'];
          }
        >
      )
      // HasFilterValues<
      //   FactoryEvent<FC>,
      //   {
      //     type: Event extends '*' ? EventKeys<FC, FromStateKey> : Event;
      //     from: FromStateKey extends keyof FC["states"] ? { key: FromStateKey } : any;
      //   }
      // > & {
      //   wtf: true
      // }
    > 
    // & Partial<{
    //   e: Event, 
    //   ek: EventKeys<FC, FromStateKey>,
    //   // e: Event extends '*' ? EventKeys<FC, FromStateKey> : Event,
    //   // from: { key: FromStateKey }    
    // }>
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
  [StateKey in keyof FC['transitions'] & FactoryEvent<FC>['from']['key'] ]: {
    [EventKey in keyof FC['transitions'][StateKey] & FactoryEventResolved<FC, StateKey>['type'] ]: FactoryEventResolved<FC, StateKey, EventKey>['to']
  };
};

export type StateEventHookConfig<FC extends FactoryMachineContext> = {
  [StateKey in string & (keyof FC["transitions"] | "*")]?: {
    on?: On<FC, StateKey>;
  } & StateTransitionHookConfig<FC, StateKey>;
};

export type FlatFactoryEventKeys<FC extends FactoryMachineContext> = string &
  {
    [StateKey in keyof FC['transitions']]: keyof FC['transitions'][StateKey];
  }[keyof FC['transitions']];
