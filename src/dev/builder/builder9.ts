export {};

export type States = Record<string, unknown>;
export type Transitions = Record<string, Record<string, string>>;

export interface BaseContext {
  states?: States;
  transitions?: Transitions;
  initialState?: string;
}

// Define capabilities that can be conditionally mixed into the MachineBuilder
export interface CanDefineStates {
  defineStates(
    states: States,
  ): MachineBuilder<{ states: States } & Omit<BaseContext, "states">>;
}

export interface CanDefineTransitions {
  defineTransitions(
    transitions: Transitions,
  ): MachineBuilder<
    { transitions: Transitions } & Omit<BaseContext, "transitions">
  >;
}

export interface CanSetInitialState {
  setInitialState(
    initialState: string,
  ): MachineBuilder<
    { initialState: string } & Omit<BaseContext, "initialState">
  >;
}

export interface CanCreateMachine {
  createMachine(): StateMachine;
}

// Conditional type that decides which builder capabilities are available based on context
export type MachineBuilder<C extends BaseContext> = (C extends {
  states: undefined;
}
  ? CanDefineStates
  : {}) &
  (C extends { states: States } ? CanDefineTransitions : {}) &
  (C extends { initialState: undefined } ? CanSetInitialState : {}) &
  (C extends { states: States; initialState: string } ? CanCreateMachine : {});

const builder1 = {} as MachineBuilder<{}>;

export interface StateMachine {
  state: string;
  send(event: string): void;
}

// Usage example
// Start with a builder that can only define states
const builder: CanDefineStates = {} as CanDefineStates;

// Define states, and now we can define transitions or set initial state
const builderWithStates = builder.defineStates({
  Idle: {},
  Working: {},
  Done: {},
});

// We choose to set the initial state first
const builderWithInitialState: CanDefineTransitions & CanCreateMachine =
  builderWithStates.setInitialState("Idle");

// Now define transitions
const builderWithTransitions = builderWithInitialState.defineTransitions({
  Idle: { start: "Working" },
  Working: { finish: "Done" },
});

// We have all required parts, create the machine
const machine: StateMachine = builderWithTransitions.createMachine();
machine.send("start"); // Should log "Event sent: start, current state: Idle"
