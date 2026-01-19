import { FactoryMachine } from "./factory-machine-types";
import type {
  FactoryMachineApi,
  addEventApi as AddEventApiType,
} from "./factory-machine-api-types";

/**
 * Creates an API object for a FactoryMachine instance, providing event sender functions for each transition.
 *
 * @template M - Type of FactoryMachine
 * @template K - Keys of machine transitions
 * @param {M} machine - The machine instance to generate the API for
 * @param {K} [filterStateKey] - Optional state key to filter transitions
 * @returns {FactoryMachineApi<M>} An object mapping event keys to sender functions
 */
export function eventApi<M extends any>(machine: M, filterStateKey?: any): any {
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
