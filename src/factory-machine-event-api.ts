import { FactoryMachine, FactoryMachineContext } from "./factory-machine-types";
import type {
  FactoryMachineApi,
  addEventApi as AddEventApiType,
} from "./factory-machine-api-types";
import type {
  HSMMachine,
  HSMEventApi,
} from "./hsm/flattened/declarative-flat";
import type { HierarchicalMachine } from "./hsm/nested/types";

/**
 * Creates an API object for a FactoryMachine instance, providing event sender functions for each transition.
 *
 * @template M - Type of FactoryMachine
 * @template K - Keys of machine transitions
 * @param {M} machine - The machine instance to generate the API for
 * @param {K} [filterStateKey] - Optional state key to filter transitions
 * @returns {FactoryMachineApi<M>} An object mapping event keys to sender functions
 */
// Duck-typed extraction of FactoryMachineContext from any machine-shaped value.
// Accepts regular FactoryMachines and HSM wrappers alike.
type FCOf<M> = M extends FactoryMachine<infer FC>
  ? FC
  : M extends { states: infer S; transitions: infer T }
    ? S extends import("./state-keyed").KeyedStateFactory
      ? { states: S; transitions: T } extends FactoryMachineContext<any>
        ? { states: S; transitions: T }
        : never
      : never
    : never;

// Direct extraction of states/transitions from any machine-shaped value
// This works for FactoryMachine, HierarchicalMachine, and wrapped machines (withReset, etc.)
type ExtractContext<M> = M extends { states: infer S; transitions: infer T }
  ? S extends import("./state-keyed").KeyedStateFactory
    ? { states: S; transitions: T } extends FactoryMachineContext<any>
      ? { states: S; transitions: T }
      : never
    : never
  : never;

export function eventApi<M extends { states: any; transitions: any; send: any }>(
  machine: M,
  filterStateKey?: keyof M["transitions"]
): M extends { shape: any }
  ? // HierarchicalMachine (has shape) - extract from states/transitions directly
    [ExtractContext<M>] extends [never]
    ? {}
    : ExtractContext<M> extends FactoryMachineContext<any>
      ? FactoryMachineApi<ExtractContext<M>>
      : {}
  : M extends HSMMachine<infer HC>
    ? HSMEventApi<HC>
    : [ExtractContext<M>] extends [never]
      ? {}
      : ExtractContext<M> extends FactoryMachineContext<any>
        ? FactoryMachineApi<ExtractContext<M>>
        : {};
export function eventApi(machine: any, filterStateKey?: any): any {
  // Check if machine has shape and use original machine for HSM
  if (machine && typeof machine === 'object' && 'shape' in machine) {
    // For HSM machines, use the original machine's transitions but call through HSM
    const originalMachine = (machine as any).__original || machine;
    const { states, transitions } = originalMachine as any;
    const createSender =
      (eventKey: any) =>
      (...params: any[]) => {
        return (machine as any).send(eventKey, ...params);
      };

    const transitioners: any = {};
    const events: any = {};
    for (const stateKey in states) {
      if (filterStateKey && stateKey !== filterStateKey) {
        continue;
      }
      const transitionKey = stateKey as keyof typeof transitions;
      const stateTransitions = transitions[transitionKey];
      transitioners[transitionKey] = {};
      if (stateTransitions) {
        for (const eventKey in stateTransitions) {
          const sender = createSender(eventKey);
          transitioners[transitionKey][eventKey] = sender;
          events[eventKey] ||= sender;
        }
      }
    }
    return events;
  }
  
  // Regular machine logic
  const { states, transitions } = machine as any;
  const createSender =
    (eventKey: any) =>
    (...params: any[]) => {
      return (machine as any).send(eventKey, ...params);
    };

  const transitioners: any = {};
  const events: any = {};
  for (const stateKey in states) {
    if (filterStateKey && stateKey !== filterStateKey) {
      continue;
    }
    const transitionKey = stateKey as keyof typeof transitions;
    const stateTransitions = transitions[transitionKey];
    transitioners[transitionKey] = {};
    if (stateTransitions) {
      for (const eventKey in stateTransitions) {
        const sender = createSender(eventKey);
        transitioners[transitionKey][eventKey] = sender;
        events[eventKey] ||= sender;
      }
    }
  }
  return events;
}

/**
 * Enhances a FactoryMachine instance with an API property containing event sender functions.
 *
 * @template M - Type of FactoryMachine
 * @param {M} target - The machine instance to enhance
 * @returns {AddEventApiType<M>} The enhanced machine with an api property
 */
export function addEventApi<M extends FactoryMachine<any>>(
  target: M
): AddEventApiType<M> {
  const enhanced = target as AddEventApiType<M>;
  if (enhanced.api) {
    return enhanced;
  }
  return Object.assign(target, {
    api: eventApi<M>(enhanced),
  }) as AddEventApiType<M>;
}
