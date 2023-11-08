type States = Record<string, unknown>;
type Transitions = Record<string, Record<string, string>>;

interface BaseContext {
  states?: States;
  transitions?: Transitions;
  initialState?: string;
}

interface CanDefineStates {
  defineStates(states: States): MachineBuilder;
}

interface CanDefineTransitions {
  defineTransitions(transitions: Transitions): MachineBuilder;
}

interface CanSetInitialState {
  setInitialState(initialState: string): MachineBuilder;
}

interface CanCreateMachine {
  createMachine(): StateMachine;
}

type MachineBuilder = CanDefineStates & CanDefineTransitions & CanSetInitialState & CanCreateMachine;

class StateMachineBuilder {
  private context: BaseContext = {};

  defineStates(states: States) {
    this.context.states = states;
    return this as MachineBuilder;
  }

  defineTransitions(transitions: Transitions) {
    this.context.transitions = transitions;
    return this as MachineBuilder;
  }

  setInitialState(initialState: string) {
    this.context.initialState = initialState;
    return this as MachineBuilder;
  }

  createMachine() {
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

interface StateMachine {
  state: string;
  send(event: string): void;
}

const machineBuilder = new StateMachineBuilder()
  .defineStates({ Idle: {}, Working: {}, Done: {} })
  .setInitialState('Idle')
  .defineTransitions({
    Idle: { start: 'Working' },
    Working: { finish: 'Done' },
  });

const machine = machineBuilder.createMachine();
machine.send('start'); // Should log "Transitioning with event: start"
