import { StateFromFactory, StatesFactory } from "./states";

// #region General
export type AnyStateKey = string | number | symbol;
export type AnyEventKey = string | number | symbol;
export interface ChangeEvent<Type, From, To> {
  type: Type;
  from: From;
  to: To;
}
export type SwapFunc<T> = (updater: (event: T) => T) => void;

// #endregion

// #region Transition Config
type SimpleStateTarget<T> = T;
type FunctionStateTarget<State> = (...args: any[]) => State;
type AdvancedFunctionStateTarget<
  States extends StatesFactory<any>,
  EventKey extends AnyEventKey = AnyEventKey,
> = (
  ...args: any[]
) => (
  state: StateFromFactory<States>,
  event: EventKey,
  machine: StateMachine<States, any>,
) => StateFromFactory<States>;
type ConfigStateTransitionExit<States extends StatesFactory<any>> =
  | SimpleStateTarget<keyof States>
  | AdvancedFunctionStateTarget<States>
  | FunctionStateTarget<StateFromFactory<States>>;

export type TransitionConfig<States extends StatesFactory<any>> = {
  [StateKey in keyof States]: {
    [EventKey: AnyEventKey]: ConfigStateTransitionExit<States>;
  };
};
// #endregion

// #region StateMachine

export interface StateMachine<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> {
  def: MachineDefinition<States, Transitions>;
  config: {
    initialState: StateFromFactory<States>;
  }; // consolidate with def?
  getState: () => StateFromFactory<States>;
  send: SendFunction<States, Transitions>;
  event: FlatMemberUnion<StateTransitioners<States, Transitions>>;
  getChange: () => StateMachineEvent<States, Transitions>;
  reset(): void; // remove// externalize
  update: SwapFunc<StateMachineEvent<States, Transitions>>;
}

export type SendFunction<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = <
  E extends S extends keyof Transitions
    ? keyof StateTransitioners<States, Transitions>[S]
    : Event["type"],
  S extends keyof Transitions = keyof States,
  P = Exclude<
    S extends keyof Transitions
      ? Parameters<StateTransitioners<States, Transitions>[S][E]>[0]
      : Parameters<StateTransitioners<States, Transitions>[keyof States][E]>[0],
    undefined
  >,
>(
  event: E,
  ...params: P[]
) => void;

export type MachineCreator<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = (
  initialState: StateFromFactory<States>,
) => StateMachine<States, Transitions>;

export type MachineDefinition<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  create: MachineCreator<States, Transitions>;
  states: States;
  transitions: Transitions;
};
// #endregion

// #region State Machine Event
export type StateMachineEvent<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  EventKey extends FlattenedEventTypes<
    States,
    Transitions
  > = FlattenedEventTypes<States, Transitions>,
  From extends StateFromFactory<States> = StateFromFactory<States>,
  To extends StateFromFactory<States> = StateFromFactory<States>,
  Params = any[],
> = Expand<
  ChangeEvent<EventKey, From, To> & {
    params: Params;
    match: <M extends ChangeEventMatchers<States, Transitions>>(
      cases: M,
    ) => M[keyof M] extends (...args: any) => infer R ? R : never;
  }
>;
// #endregion

// #region Matchers
type ChangeEventMatchers<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof Transitions]?: {
    [EventKey in keyof Transitions[StateKey]]: Transitions[StateKey][EventKey] extends keyof States
      ? (...args: Parameters<States[Transitions[StateKey][EventKey]]>) => any
      : (...args: any[]) => any;
  };
}[keyof Transitions] & {
  _?: (...args: any[]) => any;
};
// #endregion

// #region Transitioners
export type StateTransitions<States extends StatesFactory<any>, Transitions> = {
  [StateKey in keyof Transitions & keyof States]: {
    [EventKey in keyof Transitions[StateKey]]: Transitions[StateKey][EventKey] extends keyof States
      ? (
          ...args: Parameters<States[Transitions[StateKey][EventKey]]>
        ) => StateFromFactory<States, Transitions[StateKey][EventKey]> & {
          key: Transitions[StateKey][EventKey];
        }
      : Transitions[StateKey][EventKey] extends AdvancedFunctionStateTarget<
          States,
          EventKey
        >
      ? (
          ...args: Parameters<Transitions[StateKey][EventKey]>
        ) => StateFromFactory<States> & { key: Transitions[StateKey][EventKey] }
      : Transitions[StateKey][EventKey] extends FunctionStateTarget<
          StateFromFactory<States>
        >
      ? (
          ...args: Parameters<Transitions[StateKey][EventKey]>
        ) => StateFromFactory<States> & { key: Transitions[StateKey][EventKey] }
      : never;
  };
};

export type StateTransitioners<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<States, Transitions>[StateKey]]: (
      ...args: Parameters<
        StateTransitions<States, Transitions>[StateKey][EventKey]
      >
    ) => void;
  };
};


export type FlatStateEventTransitionTargets<
  Transitions extends StateTransitions<any, any>
> = {
  [StateKey in keyof Transitions]: {
    [EventKey in keyof Transitions[StateKey]]: ReturnType<
      Transitions[StateKey][EventKey]
    >;
  }[keyof Transitions[StateKey]];
}[keyof Transitions] extends infer T
  ? T extends object
    ? T
    : never
  : never;


export type StateTransitionTargetKeys<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateTransitions<States, Transitions>[StateKey][EventKey]
    >["key"];
  };
};

export type FlattenedEventTypes<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateTransitioners<
    States,
    Transitions
  >]: keyof StateTransitioners<States, Transitions>[StateKey];
}[keyof StateTransitioners<States, Transitions>];

// Utility type to get the value types of an object
type ValueTypes<T> = T[keyof T];

// doesn't filter correctly:
// Use this utility to flatten StateTransitionTargetKeys
// export type FlattenTransitionTargetKeys<
//   States extends StatesFactory<any>,
//   Transitions extends TransitionConfig<States>
// > = ValueTypes<
//   {
//     [StateKey in keyof StateTransitions<States, Transitions>]: {
//       [EventKey in keyof StateTransitions<
//         States,
//         Transitions
//       >[StateKey]]: StateTransitions<States, Transitions>[StateKey][EventKey] extends (
//         ...args: any[]
//       ) => infer TargetState
//         ? TargetState extends StateFromFactory<States, infer TargetStateKey>
//           ? TargetStateKey
//           : never
//         : never;
//     }[keyof StateTransitions<States, Transitions>[StateKey]];
//   }
// >;

// Use this utility to flatten StateTransitionTargetKeys to only include keys of RETURN states
// this seems to work
// KEEP AND ADAPT TO RETURN TARGET STATES
export type FlattenReturnStateTargetKeys<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>
> = ValueTypes<
  {
    [StateKey in keyof StateTransitions<States, Transitions>]: {
      [EventKey in keyof StateTransitions<
        States,
        Transitions
      >[StateKey]]: StateTransitions<States, Transitions>[StateKey][EventKey] extends (
        ...args: any[]
      ) => infer TargetState
        ? TargetState extends StateFromFactory<States, infer TargetStateKey>
          ? TargetState["key"] extends keyof States
            ? TargetState["key"]
            : never
          : never
        : never;
    }[keyof StateTransitions<States, Transitions>[StateKey]];
  }
>;

export type FlattenReturnStateTargets<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>
> = ValueTypes<
  {
    [StateKey in keyof StateTransitions<States, Transitions>]: {
      [EventKey in keyof StateTransitions<
        States,
        Transitions
      >[StateKey]]: StateTransitions<States, Transitions>[StateKey][EventKey] extends (
        ...args: any[]
      ) => infer TargetState
        ? TargetState extends StateFromFactory<States, infer TargetStateKey>
          ? TargetStateKey extends keyof States
            ? TargetState
            : never
          : never
        : never;
    }[keyof StateTransitions<States, Transitions>[StateKey]];
  }
>;

export type FlattenReturnStateTargetTypes<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>
> = ValueTypes<
  {
    [StateKey in keyof StateTransitions<States, Transitions>]: {
      [EventKey in keyof StateTransitions<
        States,
        Transitions
      >[StateKey]]: StateTransitions<States, Transitions>[StateKey][EventKey] extends (
        ...args: any[]
      ) => infer TargetState
        ? TargetState extends StateFromFactory<States, infer TargetStateKey>
          ? TargetStateKey extends keyof States
            ? States[TargetStateKey]
            : never
          : never
        : never;
    }[keyof StateTransitions<States, Transitions>[StateKey]];
  }
>;
/*
This yields
type TargetTypes = ((...args: number[]) => {
    data: number[];
    match: <M extends Matchers<{
        Idle: undefined;
        Orphan: undefined;
        Pending: (...params: number[]) => number[];
        Rejected: (error: Error) => Error;
        Resolved: (data: number) => number;
    }>>(casesObj: M) => M[keyof M] extends (...args: any) => infer R ? R : never;
    key: string;
}) | ((error: Error) => {
    ...;
}) | ((data: number) => {
    ...;
}) | (() => {
    ...;
}) | (() => {
    ...;
})


BUT what I want is just the return types of the functions, not the functions themselves


*/


export type FlatMachineEventToTargetKeyMap<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatMemberUnion<
  StateTransitionTargetKeys<M["def"]["states"], M["def"]["transitions"]>
>;

// not sure about this one
export type FlatMachineReturnEventToTargetKeyMap<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatMemberUnion<
  FlattenReturnStateTargetKeys<M["def"]["states"], M["def"]["transitions"]>
>;


// #endregion

// #endregion

// #region Utility
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export type Filter<T, K> = {
  [TK in keyof T]: TK extends K ? T[TK] : never;
}[keyof T];

export type TUnionToIntersection<T> = (
  T extends any ? (x: T) => any : never
) extends (x: infer R) => any
  ? R
  : never;



export type FlattenMemberKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

// #endregion

export type FlatMachineEvents<M extends StateMachine<StatesFactory<any>, any>> =
FlatMemberUnion<
StateTransitions<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlattenMembers<T> = {
  [StateKey in keyof T]: T[StateKey];
}[keyof T];

type FlatMemberUnion<T> = TUnionToIntersection<FlattenMembers<T>>;


export type StateTransitionTargets<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateTransitions<States, Transitions>[StateKey][EventKey]
    >;
  };
};


export type FlatMachineEventTargets<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatMemberUnion<
  StateTransitionTargets<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlatEventTargetsMap<
States extends StatesFactory<any>,
Transitions extends TransitionConfig<States>> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<States, Transitions>[StateKey]]: ReturnType<
      StateTransitions<States, Transitions>[StateKey][EventKey]
    >;
  };
}


export type FlatEventTargets<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>
> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateTransitions<States, Transitions>[StateKey][EventKey]
    >;
  };
}
export type FlattenedTargets<T> = {
  [K1 in keyof T]: {
    [K2 in keyof T[K1]]: T[K1][K2]
  }
}[keyof T];

//[keyof StateTransitions<States, Transitions>];


// filter from tests

// export type FlatEventTargets<
// States extends StatesFactory<any>,
// Transitions extends TransitionConfig<States>> = {
//   [StateKey in keyof StateTransitions<States, Transitions>]: {
//     [EventKey in keyof StateTransitions<States, Transitions>[StateKey]]: ReturnType<
//       StateTransitions<States, Transitions>[StateKey][EventKey]
//     >;
//   };
// }

  // Filter<FlatMachineEventTargetKeys, Event>

export type FlatEventers<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnion<StateTransitioners<States, Transitions>>;

export type FlatMachineEventers<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatEventers<M["def"]["states"], M["def"]["transitions"]>;

//#region Lifecycle

export type TransitionHookExtensions<T> = {
  guard?: (change: T) => boolean;
  before?: (change: T) => any;
  handle?: (change: T) => T | undefined;
  after?: (change: T) => any;
};

export type StateTransitionHooks<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  StateKey extends keyof Transitions | "*",
  // State extends StateFromFactory<States>
  // ReturnType<States[StateKey extends "*" ? keyof States : StateKey]
> = {
  leave?: (
    change: StateMachineEvent<
      States,
      Transitions,
      FlattenedEventTypes<States, Transitions>,
      // leave this state
      StateFromFactory<
        States,
        StateKey extends "*" ? keyof States : StateKey
      > & { key: StateKey extends "*" ? keyof States : StateKey },
      // enter any state
      StateFromFactory<States> & { key: keyof States }
    >,
  ) => any;
  enter?: (
    change: StateMachineEvent<
      States,
      Transitions,
      FlattenedEventTypes<States, Transitions>,
      // from any state
      StateFromFactory<States> & { key: keyof States },
      // to this state
      StateFromFactory<
        States,
        StateKey extends "*" ? keyof States : StateKey
      > & { key: StateKey extends "*" ? keyof States : StateKey }
    >,
  ) => any;
};

type On<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  StateKey extends keyof Transitions | "*",
> =
  // wildcard state
  StateKey extends "*"
    ? {
        [AnyStateEvent in
          | FlattenedEventTypes<States, Transitions>
          | "*"]?: TransitionHookExtensions<
          StateMachineEvent<
            States,
            Transitions,
            AnyStateEvent extends "*"
              ? FlattenedEventTypes<States, Transitions>
              : AnyStateEvent,
            // StateKey extends "*" ? StateFromFactory<States> & { key: keyof Transitions } : (ReturnType<States[StateKey]> & { key: StateKey}),
            StateFromFactory<States> & {
              key: keyof {
                [K in keyof Transitions]: AnyStateEvent extends keyof Transitions[K]
                  ? K
                  : keyof Transitions;
              };
            },
            // SOMEDAY: union of valid TARGET states, i.e. ReturnType<States[Transitions[StateKey][EventKey]]>
            FlattenReturnStateTargets<States, Transitions>,
            // AnyStateEvent extends "*" ? 
            //   StateFromFactory<States> : 
            //   Filter<
            //     FlatEventTargetsMap<States, Transitions>, AnyEventKey
            //   > extends infer U 
            //       ? U extends ReturnType<States[keyof States]> 
            //         ? U 
            //         : never 
            //       : never,

            // & {
            //   [K in keyof Transitions]: AnyStateEvent extends keyof Transitions[K]
            // }
            // & {
            //   key: keyof {
            //     [StateKeyIn in keyof Transitions]: keyof StateTransitions<
            //       States,
            //       Transitions[StateKeyIn]
            //     >;
            //   }[StateKey];
            //   // AnyStateEvent extends "*"
            //     // // wildcard event
            //     // ? keyof {
            //     //     [StateKeyIn in keyof Transitions]: keyof {
            //     //       [Event in keyof Transitions[StateKeyIn]]: Transitions[StateKeyIn][Event] extends keyof States
            //     //         ? Event
            //     //         : never;
            //     //     };
            //     //   }
            //     // : keyof {
            //     //     [StateKeyIn in keyof Transitions]: AnyStateEvent extends keyof Transitions[StateKeyIn]
            //     //       ? keyof {
            //     //           [L in keyof Transitions[StateKeyIn][AnyStateEvent]]: Transitions[StateKeyIn][AnyStateEvent][L] extends keyof States
            //     //             ? L
            //     //             : never;
            //     //         }
            //     //       : never;
            //     //   };
            // }
            any[] // could be union of all possible params
          >
        >;
      }
    : {
        [Event in keyof Transitions[StateKey] | "*"]?: Event extends "*"
          ? // wildcard event
            TransitionHookExtensions<
              StateMachineEvent<
                States,
                Transitions,
                keyof Transitions[StateKey],
                ReturnType<States[StateKey]> & { key: StateKey },
                ReturnType<States[keyof States]> & {
                  key: keyof Transitions[StateKey];
                },
                any[] // Parameters<States[Transitions[StateKey][Event]]>
              >
            >
          : // specific state and event
          Transitions[StateKey][Event] extends keyof States
          ? TransitionHookExtensions<
              StateMachineEvent<
                States,
                Transitions,
                Event, // should constrain params
                ReturnType<States[StateKey]> & { key: StateKey },
                ReturnType<States[Transitions[StateKey][Event]]> & {
                  key: Transitions[StateKey][Event];
                },
                Parameters<States[Transitions[StateKey][Event]]>
              >
            >
          : never;
      };

export type StateEventHookConfig<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof Transitions | "*"]?: {
    on?: On<States, Transitions, StateKey>;
  } & StateTransitionHooks<States, Transitions, StateKey>;
};
//#endregion