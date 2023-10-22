import { StateMachineEvent, StateMachine, TransitionConfig } from "../types";
import { StateFromFactory, StatesFactory } from "../states";
import { onUpdate } from "./on-update";

type TransitionHookExtensions<T> = {
  guard?: (change: T) => boolean;
  before?: (change: T) => any;
  handle?: (change: T) => T | undefined;
  after?: (change: T) => any;
};

type StateHookExtensions<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  TLeave extends StateFromFactory<States>,
  TEnter extends StateFromFactory<States>,
> = {
  leave?: (
    change: StateMachineEvent<States, Transitions, any, TLeave, TEnter>,
  ) => any;
  enter?: (change: TEnter) => any;
};

export type TransitionHookMapping2<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof Transitions]?: {
    on?: {
      [Event in keyof Transitions[StateKey]]?: Transitions[StateKey][Event] extends keyof States
        ? TransitionHookExtensions<
            StateMachineEvent<
              States,
              Transitions,
              Event, // should constrain params
              ReturnType<States[StateKey]>,
              ReturnType<States[Transitions[StateKey][Event]]>,
              Parameters<States[Transitions[StateKey][Event]]>
            >
          >
        : never;
    };
  } & StateHookExtensions<
    States,
    Transitions,
    ReturnType<States[StateKey]>,
    any
  >;
};

export function onLifecycle<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(
  machine: StateMachine<States, Transitions>,
  config: TransitionHookMapping2<States, Transitions>,
) {
  return onUpdate(machine, (commit, updater) => {
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
      toStateHooks?.enter?.(handled);
      commit(() => handled);
      after?.(handled as any);
      return handled;
    });
  });
}
