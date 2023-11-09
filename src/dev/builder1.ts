export {};
type States = Record<string, unknown>;
type Transitions = Record<string, Record<string, string>>;

interface Context {
  extend(...extensions: Function[]): this;
  use(...middlewares: Function[]): this;
  defineStates(states: States): ContextWithStates;
}

interface ContextWithStates<
  InitialStateKey extends undefined | string = undefined,
> extends Context {
  initialState<T extends string>(initialState: T): this & ContextWithStates<T>;
  defineTransitions(
    transitions: Transitions,
  ): this & StateMachineContext<InitialStateKey>;
}

interface StateMachineContext<
  InitialStateKey extends undefined | string = undefined,
> extends Context {
  createMachine(
    initialState?: InitialStateKey extends undefined ? string : string,
  ): StateMachine;
}

interface StateMachine {
  state: string;
  send(event: any): void;
}

// Example implementations for extenders and middleware
const withSubscribe = (machine: any) => {
  /* ... */
};
const withAsync = (machine: any) => {
  /* ... */
};
const logger = (machine: any) => {
  /* ... */
};

// Builder class
class MachineBuilder implements Context {
  private states: States = {};
  private transitions: Transitions = {};
  private middlewares: Function[] = [];
  private extensions: Function[] = [];

  defineStates(states: States): this & ContextWithStates {
    this.states = states;
    return this as this & ContextWithStates;
  }

  defineTransitions(transitions: Transitions): this & StateMachineContext {
    this.transitions = transitions;
    return this as this & StateMachineContext;
  }

  extend(...extensions: Function[]): this {
    this.extensions = extensions;
    // Apply extensions here
    return this;
  }

  use(...middlewares: Function[]): this {
    this.middlewares = middlewares;
    // Apply middleware here
    return this;
  }

  createMachine(): StateMachine {
    const machine = {
      /* ... construction of the state machine ... */
    };
    // Apply middlewares and extensions to the machine
    return machine as StateMachine;
  }
}

// Usage example
const machine =
  // const states =
  (new MachineBuilder() as Context)
    .defineStates({ Idle: {}, Done: {} })
    // const transitions = states
    .defineTransitions({ Idle: { execute: "Done" } })
    // const extensions = transitions
    .extend(withSubscribe, withAsync)
    .use(logger)
    // const machine = extensions
    .createMachine();

machine.send("execute"); // Starts the state machine
