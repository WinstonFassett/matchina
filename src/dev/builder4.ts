export {} 
type States = Record<string, unknown>;
type Transitions = Record<string, Record<string, string>>;

// Base context type with all optional properties
interface BaseContext {
  states?: States;
  transitions?: Transitions;
  initialState?: string;
}

// Context type for when states are defined
interface StatesDefinedContext extends BaseContext {
  states: States;
}

// Context type for when transitions are defined
interface TransitionsDefinedContext extends StatesDefinedContext {
  transitions: Transitions;
}

// Full context type for when all properties are required
type MachineContext = Required<BaseContext>;

interface BaseBuilder {
  use(...middlewares: Function[]): this
  extend(...extensions: Function[]): this
}

// Builder interfaces corresponding to each context stage
interface NoStatesBuilder {
  defineStates(states: States): StatesWithoutTransitionsBuilder;
}

type HasStatesBuilder<C extends BaseContext = BaseContext> = BaseBuilder & {
  defineStates(states: States): StatesWithoutTransitionsBuilder;
} & C;

interface StatesWithoutTransitionsBuilder extends HasStatesBuilder {
  defineTransitions(transitions: Transitions): TransitionsWithoutInitialStateBuilder;
}

interface TransitionsWithoutInitialStateBuilder extends HasStatesBuilder {
  setInitialState(initialState: string): FullContextMachineBuilder;
}

// mix together interfaces based on C
// if C has states, figure out which states interfaces to include
// if C has transitions, figure out which transitions interfaces to include
// figure out whether to include initial state interface
// maybe do this as a union and then flatten it? idk
/*
Discussion:
Answer yes or no:
- Can we use conditional types to do this? (yes)
- Can we use mapped types to do this? (yes)
- Can we use generics to do this? (yes)
- Can we use a combination of the above? (yes)
- Can we use a union of interfaces to do this? (no)
- Can we use a union of mapped types to do this? (no)
- Can we use a union of generics to do this? (no)
- Can we use a union of conditional types to do this? (no)
- Can we use a combination of the above? (no)

Recommendation:
- Use a combination of conditional types and mapped types
*/
type MachineBuilderForContext<C extends BaseContext> = BaseBuilder & 
  C['states'] extends undefined ? NoStatesBuilder :
  C['transitions'] extends undefined ? StatesWithoutTransitionsBuilder :
  C['initialState'] extends undefined ? TransitionsWithoutInitialStateBuilder :
  FullContextMachineBuilder;
;

interface MachineBuilder<RequiredContext> {
  createMachine(context: RequiredContext): StateMachine;
}
interface FullContextMachineBuilder {
  createMachine(context?: MachineContext): StateMachine;
}

// State machine builder class
class StateMachineBuilder implements NoStatesBuilder, StatesWithoutTransitionsBuilder, TransitionsWithoutInitialStateBuilder, FullContextMachineBuilder {
  use(...middlewares: Function[]): this {
    throw new Error("Method not implemented.");
  }
  extend(...extensions: Function[]): this {
    throw new Error("Method not implemented.");
  }
  states?: States | undefined;
  transitions?: Transitions | undefined;
  initialState?: string | undefined;
  private context: BaseContext = {};

  defineStates(states: States): StatesWithoutTransitionsBuilder {
    this.context.states = states;
    return this as any;
  }

  defineTransitions(transitions: Transitions) {
    if (!this.context.states) {
      throw new Error("States must be defined before defining transitions.");
    }
    this.context.transitions = transitions;
    return this;
  }

  setInitialState(initialState: string): FullContextMachineBuilder {
    if (!this.context.states) {
      throw new Error("States must be defined before setting the initial state.");
    }
    this.context.initialState = initialState;
    return this;
  }

  createMachine(): StateMachine {
    if (!this.context.initialState || !this.context.states || !this.context.transitions) {
      throw new Error("Initial state, states, and transitions must all be defined before creating the machine.");
    }
    // The context is now fully defined, so we can cast it to FullContext
    const fullContext: MachineContext = this.context as MachineContext;
    const machine: StateMachine = {
      state: fullContext.initialState,
      send(event: string) {
        console.log(`Transitioning with event: ${event}`);
        // Transition logic here...
      },
    };
    return machine;
  }
}

function define() {
  return new StateMachineBuilder() as NoStatesBuilder;
}

// StateMachine interface
interface StateMachine {
  state: string;
  send(event: string): void;
}

// Usage example
const machine = define()
  .defineStates({ Idle: {}, Working: {}, Done: {} })
  .defineTransitions({
    Idle: { start: 'Working' },
    Working: { finish: 'Done' },
  })
  .setInitialState('Idle')
  .createMachine();

machine.send('start'); // Should log "Transitioning with event: start"
