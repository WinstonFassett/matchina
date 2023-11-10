import { Simplify } from "../types";

export {};
type States = Record<string, unknown>;
type Transitions = Record<string, Record<string, string>>;

interface StateMachineContext {
  states: States;
  transitions: Transitions;
  initialState: string;
}

type Enhancer<C> = (target: C) => void;
type Extender<T, X = any> = (target: T) => X;
interface BaseBuilder<C> {
  use(...middlewares: Enhancer<C>[]): this;
  extend(...extensions: Extender<C>[]): this;
}

interface CanDefineStates<C> {
  defineStates<T extends States>(
    states: T,
  ): BuilderForContext<C & { states: T }>;
}

interface CanSetInitialState<C> {
  setInitialState<T extends string>(
    initialState: T,
  ): BuilderForContext<C & { initialState: T }>;
}
interface CanDefineTransitions<C> {
  defineTransitions<T extends Transitions>(
    transitions: T,
  ): BuilderForContext<C & { transitions: T }>;
}

type CanCreateStateMachine<C> = {
  createMachine: C extends StateMachineContext
    ? () // context?: Partial<StateMachineContext>
      => StateMachine
    : (
        context: Partial<StateMachineContext> &
          RemainingProperties<StateMachineContext, C>,
      ) => StateMachine;
};

type RemainingProperties<Required, Present, Match = any> = Pick<
  Required,
  Exclude<keyof Required, keyof Present> &
    (Match extends any
      ? {
          [K in keyof Required]: Required[K] extends Match ? K : never;
        }[keyof Required]
      : never)
>;

type BuilderForContext<C extends Record<string, unknown> = {}> = {
  context: C;
} & CanCreateStateMachine<C> &
  (C["states"] extends States
    ? (C["transitions"] extends Transitions
        ? // C['initialState'] extends string ? CanCreateMachine :
          {}
        : CanDefineTransitions<C>) &
        (C["initialState"] extends string ? {} : CanSetInitialState<C>)
    : CanDefineStates<C>);

export interface StateMachine {
  state: string;
  send(event: string): void;
}

// Usage example
const builder = {} as Simplify<
  BuilderForContext<{
    // states: {}, transitions: {}, initialState: 'S'
  }>
>;
builder.createMachine({ states: {}, transitions: {}, initialState: "S" });

// Define states, and now we can define transitions or set initial state
const builderWithStates = builder.defineStates({
  Idle: {},
  Working: {},
  Done: {},
});

// builderWithStates.context.states.Done;

// We can set the initial state directly after defining states
const initialStateBeforeTransitions = builderWithStates.setInitialState(
  "Idle" as const,
);
initialStateBeforeTransitions.context.states.Done;
initialStateBeforeTransitions.context.initialState = "Idle";

// Now define transitions, after setting the initial state
const initialStateWithTransitions =
  initialStateBeforeTransitions.defineTransitions({
    Idle: { start: "Working" },
    Working: { finish: "Done" },
  } as const);
initialStateWithTransitions.context.states.Idle;
initialStateWithTransitions.context.initialState = "Idle";
initialStateWithTransitions.context.transitions.Idle.start;
initialStateWithTransitions.createMachine();

const transitionsBeforeInitialState = builderWithStates.defineTransitions({});
transitionsBeforeInitialState.createMachine({ initialState: "Idle" as const });
const initialStateAfterTRansitions =
  transitionsBeforeInitialState.setInitialState("Idle" as const);
initialStateAfterTRansitions.createMachine();

// We have all required parts, create the machine
const machine: StateMachine = initialStateWithTransitions.createMachine();
machine.send("start"); // Should log "Event sent: start, current state: Idle"

builder
  .defineStates({ Idle: {}, Working: {}, Done: {} })
  .defineTransitions({
    Idle: { start: "Working" },
    Working: { finish: "Done" },
  })
  .setInitialState("Idle")
  .createMachine();
