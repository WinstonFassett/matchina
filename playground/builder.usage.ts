import { UpdateEnhancer } from "../src";
import { Func, Simplify } from "../src/types";
import { Extend, ExtendBuilder } from "./extender.usage";

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

interface BaseBuilder<C extends Partial<StateMachineContext>,M> {
  use(...middlewares: UpdateEnhancer<C>[]): this;
  extend: <R extends StateMachine<any>>(extender: Extender<M, R>) => BuilderForContext<C,R>;
  // extendMany: ExtendBuilder<C>;
}

interface CanDefineStates<C extends Partial<StateMachineContext>,M> extends BaseBuilder<C,M> {
  defineStates<T extends States>(
    states: T,
  ): BuilderForContext<C & { states: T },M>;
}

interface CanSetInitialState<C extends Partial<StateMachineContext>,M> extends BaseBuilder<C,M> {
  setInitialState<T extends string>(
    initialState: T,
  ): BuilderForContext<C & { initialState: T }, M>;
}
interface CanDefineTransitions<C extends Partial<StateMachineContext>,M> extends BaseBuilder<C,M> {
  defineTransitions<T extends Transitions>(
    transitions: T,
  ): BuilderForContext<C & { transitions: T }, M>;
}

type StateMachineFromBuilder<C> = StateMachine<C extends StateMachineContext ? C : StateMachineContext>;

interface CanCreateStateMachine<C extends Partial<StateMachineContext>, M extends StateMachineFromBuilder<C>> extends BaseBuilder<C,M> {
  createMachine: C extends StateMachineContext
    ? () // context?: Partial<StateMachineContext>
      => M
    : <RC extends RemainingProperties<StateMachineContext, C>>(
        context: RC,
      ) => StateMachineFromBuilder<C & RC & StateMachineContext>;
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

type BuilderForContext<C extends Partial<StateMachineContext>, M> = {
  context: C;
} & CanCreateStateMachine<C,M> &
  (C["states"] extends States
    ? (C["transitions"] extends Transitions
        ? // C['initialState'] extends string ? CanCreateMachine :
          {}
        : CanDefineTransitions<C,M>) &
        (C["initialState"] extends string ? {} : CanSetInitialState<C,M>)
    : CanDefineStates<C,M>);

export interface StateMachine<C extends StateMachineContext> {
  context: C;
  state: keyof C['states'];
  send(event: string): void;
}

// Usage example
const builder = {} as Simplify<
  BuilderForContext<{
    // states: {}, transitions: {}, initialState: 'S'
  }, StateMachine<any>>
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
const machine = initialStateWithTransitions.createMachine();
machine.send("start"); // Should log "Event sent: start, current state: Idle"

const m2 = builder
  .use((commit, updater) => {
    commit(updater)
  })
  .extend(x => ({...x, hello: 'world'}))
  .extend(pipe(
    x => ({...x, there: 'world'}),
    x => ({...x, kablamo: 'world' as const})
  )
  )
  .defineStates({ Idle: {}, Working: {}, Done: {} })
  .defineTransitions({
    Idle: { start: "Working" },
    Working: { finish: "Done" },
  })
  .setInitialState("Idle")
  // .extend(x => ({...x}))
  .createMachine();
  
m2.send('start');
m2.kablamo = 'world'

function pipe<A, B, C>(f1: Func<A, B>, f2: Func<B, C>): Func<A, C>;
function pipe<A, B, C, D>(
  f1: Func<A, B>,
  f2: Func<B, C>,
  f3: Func<C, D>,
): Func<A, D>;
function pipe<A, B, C, D, E>(
  f1: Func<A, B>,
  f2: Func<B, C>,
  f3: Func<C, D>,
  f4: Func<D, E>,
): Func<A, E>;
function pipe<A, B, C, D, E, F>(
  f1: Func<A, B>,
  f2: Func<B, C>,
  f3: Func<C, D>,
  f4: Func<D, E>,
  f5: Func<E, F>,
): Func<A, F>;
function pipe(...functions: Function[]): Function {
  return (arg: any) => functions.reduce((result, func) => func(result), arg);
}