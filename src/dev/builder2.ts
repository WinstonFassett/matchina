export {}
type States = Record<string, unknown>;
type Transitions = Record<string, Record<string, string>>;

// Initial empty context
interface EmptyContext {
  states?: never;
  transitions?: never;
  initialState?: never;
}

// Context after states are defined
interface StatesDefinedContext {
  states: States;
  transitions?: never;
  initialState?: never;
}

// Context after transitions are defined
interface TransitionsDefinedContext {
  states: States;
  transitions: Transitions;
  initialState?: never;
}

// Fully defined context ready to create the state machine
interface FullContext {
  states: States;
  transitions: Transitions;
  initialState: string;
}

type Context = EmptyContext | StatesDefinedContext | TransitionsDefinedContext | FullContext;

class StateMachineBuilder<Ctx extends Context> {
  private context: Ctx;

  constructor(context: Ctx) {
    this.context = context;
  }

  defineStates(states: States): StateMachineBuilder<StatesDefinedContext> {
    return new StateMachineBuilder<StatesDefinedContext>({ ...this.context, states } as StatesDefinedContext);
  }

  defineTransitions(this: StateMachineBuilder<StatesDefinedContext>, transitions: Transitions): StateMachineBuilder<TransitionsDefinedContext> {
    return new StateMachineBuilder<TransitionsDefinedContext>({ ...this.context, transitions } as TransitionsDefinedContext);
  }

  setInitialState(this: StateMachineBuilder<TransitionsDefinedContext>, initialState: keyof States): StateMachineBuilder<FullContext> {
    return new StateMachineBuilder<FullContext>({ ...this.context, initialState } as FullContext);
  }

  createMachine(this: StateMachineBuilder<FullContext>): StateMachine {
    // Implementation to create the actual state machine
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

// The StateMachine type with a generic context
interface StateMachine {
  state: string;
  send(event: string): void;
}

// Usage
const builder = new StateMachineBuilder({} as EmptyContext)

const machine = builder
  .defineStates({ Idle: {}, Working: {}, Done: {} })
  .defineTransitions({
    Idle: { start: 'Working' },
    Working: { finish: 'Done' },
  })
  .setInitialState('Idle')
  .createMachine();

machine.send('start'); // Should log "Transitioning with event: start"
