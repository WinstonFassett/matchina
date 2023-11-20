import { Middleware } from "../../extras/middleware";
import { AnyMachineChangeEvent, StateChangeMachineTransitionContext, MachineContextEvent, ResolveTransition, TransitionConfig, AnyStatesFactory, CreateStateChangeMachineProps, StateFromFactory, StateMachine, StateChangeMachineInternals, ChangeMachineEvent } from "./machine-types-v2";
import { emptyEffect, atom } from "./bootstrap";

export const defaultInternals = {
  guard: (event: AnyMachineChangeEvent) => true,
  handle: (event: AnyMachineChangeEvent) => event,
  enter: emptyEffect,
  exit: emptyEffect,
};

export function createResolver<
  C extends StateChangeMachineTransitionContext<any, any>,
  E extends MachineContextEvent<C> = MachineContextEvent<C>,
>(context: C): ResolveTransition<E> {
  // console.log('createResolver', context)
  const { states, transitions } = context;
  return ({ from, type, params, machine }) => {
    // console.log('resolve', {from, type, params, machine})
    const to = transitions[from.key][type];
    if (!to) return undefined;
    if (typeof to === "function") {
      const targetStateOrFunc = to(...params);
      return typeof targetStateOrFunc === "function"
        ? targetStateOrFunc(from, type, context, machine)
        : targetStateOrFunc;
    } else {
      return states[to as keyof typeof states](...params) as any;
    }
  };
}

export function createStateChangeMachine<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
  Props extends CreateStateChangeMachineProps<SF>, 
  E extends MachineContextEvent<StateChangeMachineTransitionContext<TC, SF>>,
>(
  states: SF,
  initialState: StateFromFactory<SF>,
  transitions: TC,
  init?: Middleware<CreateStateChangeMachineProps<SF>>,
): StateMachine<TC, SF> {
  const ensureKernel = (props: Props): StateChangeMachineInternals<TC, SF, E> => {
    // console.log('ensureKernel', props)
    return Object.assign(props, {
      ...defaultInternals,    
      states,
      transitions,
      store: props.store ?? atom<E>({} as E),
      resolve: props.resolve ?? createResolver({ states, transitions }),
    })
  }
  let kernelInit = {  } as Props;
  let kernel: StateChangeMachineInternals<TC, SF, E> = kernelInit as any;
  if (init) {
    console.log('INIT', init)
    init(kernelInit, (enhanced) => {  
      console.log({ enhanced })
      if (enhanced && enhanced !== kernelInit) {
        kernelInit = enhanced as Props;
        console.log("something replaced the internals");
      }
    });
    ensureKernel(kernelInit);
  } else {
    ensureKernel(kernelInit);
  }
  const internals = kernel; // as ChangeMachineInternals<E>;
  if (!internals.store) internals.store = atom<E>({} as E);
  internals.store.set({
    type: "__init",
    from: undefined,
    to: initialState,
    params: [] as any[],
  } as E);
  const machine = {
    getChange: () => internals.store.get(),
    getState: () => internals.store.get().to,
    send: (type, ...params) => {
      console.log('send', { type, params })
      const lastEvent = internals.store.get();
      const nextState = internals.resolve({
        ...lastEvent,
        from: lastEvent.to,
        type,
        params,
        machine,
      });
      if (!nextState) return;
      const nextEvent = {
        ...lastEvent,
        type,
        from: lastEvent.to,
        to: nextState,
        params
      };
      if (!internals.guard(nextEvent)) return;
      const handled = internals.handle(nextEvent);
      if (!handled) return;
      internals.store.set(handled);
      console.log('running effects')
      console.log('EXIT', handled.from?.key)
      internals.exit(handled);
      console.log('ENTER', handled.to.key)
      internals.enter(handled);
    },
    api: {} as any, // stubs,
    senders: {} as any, // stubs
  };
  return machine;
}



