import { FactoryMachine, effect } from "../src";

export const autotransition = (eventType = '') =>
  (machine: FactoryMachine<any>) => {
    return effect(ev => {
      const toKey = ev.to.key;
      const stateTransitions = machine.transitions[toKey];
      if (stateTransitions) {
        const autotransition = stateTransitions[eventType as keyof typeof stateTransitions];
        if (autotransition) {
          console.log('autotransition', autotransition);
          machine.send(eventType, ...(ev.params as any));
        }
      }
    })(machine);
  }
