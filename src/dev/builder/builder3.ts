export {};
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

// Builder interfaces corresponding to each context stage
interface StatesBuilder {
  defineStates(states: States): TransitionsBuilder;
}

interface TransitionsBuilder {
  defineTransitions(transitions: Transitions): InitialStateBuilder;
}

interface InitialStateBuilder {
  setInitialState(initialState: string): MachineBuilder;
}

interface MachineBuilder {
  createMachine(context: MachineContext): StateMachine;
}

// State machine builder class
class StateMachineBuilder
  implements
    StatesBuilder,
    TransitionsBuilder,
    InitialStateBuilder,
    MachineBuilder
{
  private context: BaseContext = {};

  defineStates(states: States): TransitionsBuilder {
    this.context.states = states;
    return this;
  }

  defineTransitions(transitions: Transitions): InitialStateBuilder {
    if (!this.context.states) {
      throw new Error("States must be defined before defining transitions.");
    }
    this.context.transitions = transitions;
    return this;
  }

  setInitialState(initialState: string): MachineBuilder {
    if (!this.context.states) {
      throw new Error(
        "States must be defined before setting the initial state.",
      );
    }
    this.context.initialState = initialState;
    return this;
  }

  createMachine(): StateMachine {
    if (
      !this.context.initialState ||
      !this.context.states ||
      !this.context.transitions
    ) {
      throw new Error(
        "Initial state, states, and transitions must all be defined before creating the machine.",
      );
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

// StateMachine interface
interface StateMachine {
  state: string;
  send(event: string): void;
}

// Usage example
const machine = new StateMachineBuilder()
  .defineStates({ Idle: {}, Working: {}, Done: {} })
  .setInitialState("Idle")
  .defineTransitions({
    Idle: { start: "Working" },
    Working: { finish: "Done" },
  })
  .createMachine();

machine.send("start"); // Should log "Transitioning with event: start"
