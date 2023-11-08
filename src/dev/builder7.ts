export {}
type States = Record<string, unknown>;
type Transitions = Record<string, Record<string, string>>;

interface Context {
  states?: States;
  transitions?: Transitions;
  initialState?: string;
}

// Builder interfaces expressing the possible states of the builder
interface BaseBuilder {
  defineStates(states: States): StatesDefinedBuilder;
}

interface StatesDefinedBuilder {
  defineTransitions(transitions: Transitions): TransitionsDefinedBuilder;
  setInitialState(initialState: string): InitialStateDefinedBuilder;
}

interface TransitionsDefinedBuilder {
  setInitialState(initialState: string): InitialStateDefinedBuilder;
}

interface InitialStateDefinedBuilder {
  defineTransitions(transitions: Transitions): TransitionsDefinedBuilder;
  createMachine(): StateMachine;
}

// State machine builder class
class StateMachineBuilder implements BaseBuilder {
  private context: Context = {};

  defineStates(states: States): StatesDefinedBuilder {
    return Object.assign(this, { context: { ...this.context, states } });
  }

  defineTransitions(transitions: Transitions): TransitionsDefinedBuilder {
    return Object.assign(this, { context: { ...this.context, transitions } });
  }

  setInitialState(initialState: string): InitialStateDefinedBuilder {
    return Object.assign(this, { context: { ...this.context, initialState } });
  }

  createMachine(): StateMachine {
    if (!this.context.states || !this.context.initialState) {
      throw new Error("States and initial state must be defined before creating the machine.");
    }

    const machine: StateMachine = {
      state: this.context.initialState,
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
  .setInitialState('Idle') // Now we can set the initial state independently of transitions
  .defineTransitions({
    Idle: { start: 'Working' },
    Working: { finish: 'Done' },
  })
  .createMachine();

machine.send('start'); // Should log "Transitioning with event: start"
