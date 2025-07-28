import { FactoryMachine } from "./factory-machine-types";
import { FactoryMachineApi, WithApi } from "./factory-machine-api-types";

export function createApi<
  M extends FactoryMachine<any>,
  K extends keyof M["transitions"] = keyof M["transitions"],
>(machine: M, filterStateKey?: K): FactoryMachineApi<M> {
  const { states, transitions } = machine;
  const createSender =
    (eventKey: any) =>
    (...params: any[]) => {
      return machine.send(eventKey, ...(params as any));
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

export function withApi<M extends FactoryMachine<any>>(target: M) {
  const enhanced = target as WithApi<M>;
  if (enhanced.api) {
    return enhanced;
  }
  return Object.assign(target, {
    api: createApi<M>(enhanced),
  }) as WithApi<M>;
}
