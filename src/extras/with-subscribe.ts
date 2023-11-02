import { StateMachine, TransitionConfig } from "../machine-types";
import { StateFromFactory, StatesFactory } from "../states";
// import { MethodEnhancer } from "./methodware";
import { Subscribe, nanosubscriber } from "./nanosubscriber";
// import { onUpdate } from "./on-update";

export function withSubscribe<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  // M extends StateMachine<States, Transitions>,
>(machine: StateMachine<States, Transitions>) {
  type State = StateFromFactory<(typeof machine)["def"]["states"]>;
  const state = machine.getState();
  const [subscribe, emit] = nanosubscriber<State>();
  machine.update((state) => {
    return state;
  });
  type M = typeof machine;
  type Update = M["update"];
  type Other = StateMachine<States, Transitions>["update"];
  type X = MethodEnhancer<M, "update">;
  const m = {} as X;

  // m()
  const dispose = onUpdate(machine, (commit, updater) => {
    commit(updater);
    const state = machine.getState();
    emit(machine.getState());
  });
  return Object.assign(machine, {
    subscribe,
    dispose,
  }) as SubscribableMachine<typeof machine>;
}
export type SubscribableMachine<
  M extends StateMachine<any, any> = StateMachine<any, any>,
> = M & {
  subscribe: Subscribe<ReturnType<M["getState"]>>;
  dispose: () => void;
};

function onUpdate<
  A extends any[],
  R,
  M extends {
    update: (...args: A) => R;
  },
>(machine: M, customFn: MethodEnhancer<M, "update">) {
  return wrapMethod(machine, "update", customFn);
}

// export type UpdateEnhancer<M extends { update: SwapFunc<any> }> =
//   MethodEnhancer<M, "update">;

type MethodEnhancer<S, K extends keyof S> = S[K] extends (
  ...args: infer A
) => infer R
  ? (original: Method<S, K>, ...args: A) => R
  : S[K] extends (...args: infer A) => void
  ? (original: Method<S, K>, ...args: A) => void
  : never;

type Method<S, K extends keyof S> = S[K] extends (...args: infer A) => infer R
  ? (...args: A) => R
  : S[K] extends (...args: infer A) => void
  ? (...args: A) => void
  : never;

function wrapMethod<S, K extends keyof S>(
  subject: S,
  name: K,
  fn: MethodEnhancer<S, K>,
) {
  const original = subject[name];
  const originalMethod = subject[name] as unknown as Method<S, K>;
  const boundOriginal = originalMethod.bind(subject);
  subject[name] = function (...args: any[]) {
    return fn.call(subject, boundOriginal as any, ...args);
  } as any;
  return () => {
    subject[name] = original;
  };
}
