export {};

type States = Record<string, unknown>;
type Transitions = Record<string, Record<string, string>>;

// Context interfaces with optional properties
interface Context {
  states?: States;
  transitions?: Transitions;
  initialState?: string;
}

// Negative interfaces
interface NoInitialState {
  initialState?: never;
}

interface NoStates {
  states?: never;
}

interface NoTransitions {
  transitions?: never;
}

// Builder interfaces that condition on the negative interfaces
interface BaseBuilder {
  defineStates(states: States): StatesDefinedBuilder;
}

interface StatesDefinedBuilder extends Omit<BaseBuilder, "defineStates"> {
  defineTransitions(transitions: Transitions): TransitionsDefinedBuilder;
  setInitialState(initialState: string): InitialStateDefinedBuilder;
}

interface TransitionsDefinedBuilder
  extends Omit<StatesDefinedBuilder, "defineTransitions"> {
  setInitialState(initialState: string): InitialStateDefinedBuilder;
}

interface InitialStateDefinedBuilder {
  createMachine<Ctx extends Context & NoInitialState>(
    initialState: Ctx["initialState"],
  ): StateMachine;
}

// State machine builder class
class StateMachineBuilder
  implements
    BaseBuilder,
    StatesDefinedBuilder,
    TransitionsDefinedBuilder,
    InitialStateDefinedBuilder
{
  private context: Context = {};

  defineStates(states: States): StatesDefinedBuilder {
    this.context.states = states;
    return this;
  }

  defineTransitions(transitions: Transitions): TransitionsDefinedBuilder {
    if (!this.context.states) {
      throw new Error("States must be defined before defining transitions.");
    }
    this.context.transitions = transitions;
    return this;
  }

  setInitialState(initialState: string): InitialStateDefinedBuilder {
    this.context.initialState = initialState;
    return this;
  }

  createMachine<Ctx extends Context & NoInitialState>(
    initialState?: Ctx["initialState"],
  ): StateMachine {
    const finalContext: Context = {
      ...this.context,
      initialState: initialState ?? this.context.initialState,
    };

    if (!finalContext.states || !finalContext.initialState) {
      throw new Error(
        "States and initial state must be defined before creating the machine.",
      );
    }

    const machine: StateMachine = {
      state: finalContext.initialState,
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
  .setInitialState("Idle") // Now we can set the initial state independently of transitions
  .defineTransitions({
    Idle: { start: "Working" },
    Working: { finish: "Done" },
  })
  .createMachine(); // We can create a machine without explicitly setting an initial state again

machine.send("start"); // Should log "Transitioning with event: start"
