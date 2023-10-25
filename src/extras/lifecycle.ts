import {
  StateMachineEvent,
  StateMachine,
  TransitionConfig,
  FlattenedEventTypes,
} from "../types";
import { StateFromFactory, StatesFactory } from "../states";
import { UpdateEnhancer, onUpdate } from "./on-update";

type TransitionHookExtensions<T> = {
  guard?: (change: T) => boolean;
  before?: (change: T) => any;
  handle?: (change: T) => T | undefined;
  after?: (change: T) => any;
};

type StateTransitionHooks<
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
              key: AnyStateEvent extends "*"
                ? keyof Transitions
                : keyof Transitions;
            },
            StateFromFactory<States> & { key: keyof States },
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

export function onLifecycle<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(
  machine: StateMachine<States, Transitions>,
  config: StateEventHookConfig<States, Transitions>,
) {
  return onUpdate(machine, lifecycle(config));
}

export function lifecycle<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(
  config: StateEventHookConfig<States, Transitions>,
): UpdateEnhancer<StateMachine<States, Transitions>> {
  return (commit, updater) => {
    commit((current) => {
      const updated = updater(current);
      const { to: currentState } = current;
      const { type: event } = updated;
      const fromStateHooks = config[currentState.key as keyof typeof config];
      const fromStateEventHooks = fromStateHooks?.on;
      const currentEventHooks = fromStateEventHooks?.[event];
      const { handle, guard, before, after } = currentEventHooks || {};
      if (guard && !guard(updated as any)) {
        return current;
      }
      const handled = handle
        ? (handle(updated as any) as typeof updated) ?? current
        : updated;
      if (handled === current) {
        return handled;
      }
      const { to } = handled;
      const toStateHooks = config[to.key as keyof typeof config];

      fromStateHooks?.leave?.(handled as any); // todo: remove need for any
      before?.(handled as any);
      toStateHooks?.enter?.(handled as any);
      commit(() => handled);
      after?.(handled as any);
      return handled;
    });
  };
}
