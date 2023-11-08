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
interface NoStatesBuilder extends BaseBuilder {
  defineStates(states: States): StatesWithoutTransitionsBuilder;
}

// type HasStatesBuilder<C extends BaseContext = BaseContext> = BaseBuilder & {
//   defineStates(states: States): StatesWithoutTransitionsBuilder;
// } & C;

interface StatesWithoutTransitionsBuilder extends BaseBuilder, MachineBuilder<{
  transitions: Transitions
}> {
  defineTransitions(transitions: Transitions): TransitionsWithoutInitialStateBuilder;
}

interface TransitionsWithoutInitialStateBuilder extends BaseBuilder, MachineBuilder<{
  initialState: string
}> {
  setInitialState(initialState: string): FullContextMachineBuilder;
}

// type MachineBuilderForContext<C extends BaseContext> = BaseBuilder & 
//   C['states'] extends undefined ? NoStatesBuilder :
//   C['transitions'] extends undefined ? StatesWithoutTransitionsBuilder :
//   C['initialState'] extends undefined ? TransitionsWithoutInitialStateBuilder :
//   FullContextMachineBuilder;
// ;

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
const context = define()
  .use(() => {})
  .extend(() => {})
const states = context
  .defineStates({ Idle: {}, Working: {}, Done: {} })  
const machineFromStates = states.createMachine({ 
  transitions: {} 
})
const transitions = states
  .defineTransitions({
    Idle: { start: 'Working' },
    Working: { finish: 'Done' },
  })
const machineFromTransitions = transitions.createMachine({
  initialState: 'Idle',
})
const initial = transitions
  .setInitialState('Idle')
const machine = initial
  .createMachine();

machine.send('start'); // Should log "Transitioning with event: start"
