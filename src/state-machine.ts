import { EventLifecycle } from "./event-lifecycle";
import { ResolveEvent } from "./state-machine-types";

/**
 * StateMachine interface defines the contract for all state machine implementations in Matchina.
 * It includes core lifecycle methods and hooks for managing state transitions, event handling,
 * and side effects.
 *
 * See also:
 *   - {@link FactoryMachine} and {@link createMachine} for strongly-typed factory-based state machines.
 *
 * Lifecycle steps:
 * 1. `send(type, ...params)` - Initiates a transition event.
 * 2. `resolveExit(ev)` - Determines the target state for the event.
 * 3. `transition(ev)` - Triggers the transition lifecycle, handling all steps for processing a change event.
 * 4. `guard(ev)` - Checks if the transition is allowed.
 * 5. `handle(ev)` - Processes the event, may abort if returns undefined.
 * 6. `before(ev)` - Prepares for state change, may abort if returns undefined.
 * 7. `update(ev)` - Applies the state update.
 * 8. `effect(ev)` - Runs side effects, calls leave/enter hooks.
 * 9. `leave(ev)` - Called when leaving the previous state.
 * 10. `enter(ev)` - Called when entering the new state.
 * 11. `notify(ev)` - Notifies subscribers of the change.
 * 12. `after(ev)` - Final hook after transition completes.
 */
export interface StateMachine<E extends TransitionEvent = TransitionEvent>
  extends EventLifecycle<E> {
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
}

/**
 * TransitionEvent describes a transition (change) event in a state machine. See {@link StateMachine}
 * Includes the event type, parameters, source and target states, and a reference to the machine.
 *
 * See also:
 *   - {@link FactoryMachine} and {@link createMachine}
 *
 * @template To - Target state type
 * @template From - Source state type
 * @property type - The event type string.
 * @property params - Parameters passed to the event, forwarded through the lifecycle.
 * @property to - The target state for the transition.
 * @property from - The source state for the transition.
 * @property machine - Reference to the state machine instance handling this event.
 * @source
 * This interface is used throughout Matchina to represent events that trigger state transitions.
 * It provides a consistent structure for event handling, allowing for type-safe interactions with state machines.
 * It is a core part of the Matchina API, enabling developers to define and manage state
 */
export interface TransitionEvent<To = unknown, From = To> {
  type: string; // The event type string
  params: any[]; // Parameters passed to the event
  to: To; // Target state for the transition
  from: From; // Source state for the transition
  get machine(): StateMachine<TransitionEvent<To, From>>; // Reference to the state machine instance
}
