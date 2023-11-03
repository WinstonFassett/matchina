import { StatesMatchboxFactory } from "../states";
import { StateMachine, TransitionConfig } from "../machine-types";
import {
  PartialTransitionHookExtensions,
  StateEventHookConfig,
  StateTransitionHooks,
  TransitionHookExtensions,
} from "./lifecycle-types";
import { UpdateEnhancer, onUpdate } from "./on-update";

type Dispose = () => void;

type LifecycleApi<T, S, E> = {
  [Key in keyof TransitionHookExtensions<T>]: (
    stateKey: S,
    eventKey: E,
    fn: TransitionHookExtensions<T>[Key],
  ) => Dispose;
};

export function onLifecycle<
  States extends StatesMatchboxFactory,
  Transitions extends TransitionConfig<States>,
>(
  machine: StateMachine<States, Transitions>,
  config: StateEventHookConfig<States, Transitions>,
  // initialize?:
  //   | undefined
  //   | ((
  //       api: LifecycleApi<
  //         ReturnType<StateMachine<States, Transitions>["getChange"]>,
  //         string,
  //         string
  //       >,
  //     ) => void),
) {
  return onUpdate(machine, lifecycle(config));
}

export function lifecycle<
  States extends StatesMatchboxFactory,
  Transitions extends TransitionConfig<States>,
>(
  config: StateEventHookConfig<States, Transitions>,
): UpdateEnhancer<StateMachine<States, Transitions>> {
  return (commit, updater) => {
    commit((current) => {
      const updated = updater(current);
      const { to: currentState } = current;
      const { type: event } = updated;
      const globalStateHooks = config["*"];
      const currentStateHooks = config[currentState.key as keyof typeof config];
      const currentStateCurrentEventHooks =
        currentStateHooks?.on?.[
          event as keyof (typeof currentStateHooks)["on"]
        ];

      const eventHooksMaybe = [
        globalStateHooks?.on?.["*"],
        globalStateHooks?.on?.[event as keyof (typeof globalStateHooks)["on"]],
        currentStateHooks?.on?.["*"],
        currentStateHooks?.on?.[
          event as keyof (typeof currentStateHooks)["on"]
        ],
        currentStateCurrentEventHooks,
      ];
      // GUARD
      if (
        eventHooksMaybe.some(
          (hooks) => hooks?.guard && !hooks.guard(updated as any),
        )
      ) {
        return current;
      }
      // HANDLE
      const handle = currentStateCurrentEventHooks?.handle;
      const handled = handle
        ? (handle(updated as any) as typeof updated) ?? current
        : updated;
      if (handled === current) {
        return handled;
      }
      const nextStateHooks = config[handled.to.key as keyof typeof config];
      const runStateHooks = (
        stateHooksMaybe: StateTransitionHooks<States, Transitions, any>[],
        hookName: keyof StateTransitionHooks<any, any, any>,
      ) => {
        for (const hooks of stateHooksMaybe) {
          hooks?.[hookName]?.(handled as any);
        }
      };
      const runEventHooks = (
        hookName: keyof PartialTransitionHookExtensions<any>,
      ) => {
        for (const hooks of eventHooksMaybe) {
          hooks?.[hookName]?.(handled as any);
        }
      };
      // LEAVE, BEFORE, ENTER, COMMIT, AFTER
      runStateHooks([currentStateHooks, globalStateHooks] as any, "leave");
      runEventHooks("before");
      runStateHooks([globalStateHooks, nextStateHooks] as any, "enter");
      commit(() => handled);
      eventHooksMaybe.reverse();
      runEventHooks("after");
      return handled;
    });
  };
}
