import { ResolveEvent } from "./state-machine-types";

/**
 * StateMachine interface defines the contract for all state machine implementations in Matchina.
 * It includes core lifecycle methods and hooks for managing state transitions, event handling,
 * and side effects.
 *
 * See also:
 *   - {@link FactoryMachine} and {@link createMachine} for strongly-typed factory-based state machines.
 *   - {@link TransitionMachine} and {@link createTransitionMachine} for a less-typed, event-based state machine. Used internally by FactoryMachine.
 *
 * Lifecycle steps:
 * 1. `send(type, ...params)` - Initiates a transition event.
 * 2. `resolveExit(ev)` - Determines the target state for the event.
 * 3. `guard(ev)` - Checks if the transition is allowed.
 * 4. `handle(ev)` - Processes the event, may abort if returns undefined.
 * 5. `before(ev)` - Prepares for state change, may abort if returns undefined.
 * 6. `update(ev)` - Applies the state update.
 * 7. `effect(ev)` - Runs side effects, calls leave/enter hooks.
 * 8. `leave(ev)` - Called when leaving the previous state.
 * 9. `enter(ev)` - Called when entering the new state.
 * 10. `notify(ev)` - Notifies subscribers of the change.
 * 11. `after(ev)` - Final hook after transition completes.
 */
export interface StateMachine<E extends TransitionEvent = TransitionEvent> {
  /**
   * Returns the current state of the machine (the `to` property of the last change).
   */
  getState(): E["to"] | E["from"];
  /**
   * Returns the last change event, including type, from, and to states.
   */
  getChange(): E;
  /**
   * Public API for sending an event to the machine. Parameters are attached to the event and
   * forwarded through the transition lifecycle as `.params`.
   */
  send: (type: E["type"], ...params: E["params"]) => void;
  /**
   * Determines the target ("to") state for a new event. Returns undefined for early exit.
   * Typically looks up transitions using `machine.transitions[ev.from.key][ev.type]`.
   */
  resolveExit(ev: ResolveEvent<E>): E | undefined;
  /**
   * Umbrella operation for the transition lifecycle. Handles all steps for processing a change event.
   */
  transition(change: E): void;
  /**
   * Checks if a transition event is allowed to proceed. Returns true to continue, false to abort.
   */
  guard(ev: E): boolean;
  /**
   * Processes the event. May abort the transition if returns undefined.
   */
  handle(ev: E): E | undefined;
  /**
   * Called before the transition is applied. May abort if returns undefined.
   * (Represents a beforeTransition hook, not state entry/exit.)
   */
  before(ev: E): E | undefined;
  /**
   * Applies the state update.
   */
  update(ev: E): void;
  /**
   * Runs side effects for the transition. By default, calls `leave` and `enter` hooks.
   */
  effect(ev: E): void;
  /**
   * Called when leaving the previous state.
   */
  leave(ev: E): void;
  /**
   * Called when entering the new state.
   */
  enter(ev: E): void;
  /**
   * Notifies subscribers of the change.
   */
  notify(ev: E): void;
  /**
   * Final hook after transition completes. (Represents afterTransition, not state entry/exit.)
   */
  after(ev: E): void;
}

/**
 * TransitionEvent describes a transition event in a state machine. See {@link StateMachine}
 * Includes the event type, parameters, source and target states, and a reference to the machine.
 *
 * See also:
 *   - {@link TransitionMachine} (see createTransitionMachine)
 *   - {@link FactoryMachine} (see createMachine)
 *
 * @template To - Target state type
 * @template From - Source state type
 * @property type - The event type string.
 * @property params - Parameters passed to the event, forwarded through the lifecycle.
 * @property to - The target state for the transition.
 * @property from - The source state for the transition.
 * @property machine - Reference to the state machine instance handling this event.
 */
export interface TransitionEvent<
  To = unknown,
  From = To,
> {
  type: string; // The event type string
  params: any[]; // Parameters passed to the event
  to: To; // Target state for the transition
  from: From; // Source state for the transition
  get machine(): StateMachine<TransitionEvent<To, From>>; // Reference to the state machine instance
}
