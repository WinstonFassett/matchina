import { AnyStatesFactory, TransitionConfig, StateTransitionEvent, StateMachine, StateChangeMachineTransitionContext } from "./machine-types-v2";
import { ChangeEvent } from "./machine-types-v2";

type ConfiguredTransitions<Config, SR> = {
  [S in keyof Config]: {
    [E in keyof Config[S]]: Config[S][E] extends keyof SR // state key
    ? SR[Config[S][E]] : Config[S][E] extends (...params: any[]) => (...params: any[]) => any ? ReturnType<ReturnType<Config[S][E]>> : Config[S][E] extends (...params: any[]) => any ? ReturnType<Config[S][E]> : never;
  };
};type AnyChangeEvent = ChangeEvent<any, any, any>;
interface StateChangeMachineTransitionRuntimeContext<
  SF extends AnyStatesFactory,
  TC extends TransitionConfig<SF>,
  E extends StateTransitionEvent<TC, SF>,
  M extends StateMachine<TC, SF, E>
> extends StateChangeMachineTransitionContext<TC, SF> {
  machine: M;
}

