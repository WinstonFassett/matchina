import {
  defineStates,
  createMachine,
  setup,
  effect,
  when,
  zen,
} from "matchina";
import { tickEffect } from "../lib/tick-effect";

// ---cut---

export const createTrafficLight = () => {
  // Define states using defineStates
  const states = defineStates({
    Red: () => "means stop",
    Green: () => "means go",
    Yellow: () => "means caution",
  });

  // Create the base machine with states, transitions, and initial state
  const baseMachine = createMachine(
    states,
    {
      Red: { next: "Green" },
      Green: { next: "Yellow" },
      Yellow: { next: "Red" },
    },
    "Red",
  );

  // Use zen to enhance the machine with utility methods
  const machine = zen(baseMachine);

  setup(machine)(
    effect(
      when(
        (_ev) => true,
        (change) =>
          tickEffect(
            machine.next,
            change.to.match({
              Red: () => 2000,
              Green: () => 2000,
              Yellow: () => 1000,
            }),
          ),
      ),
    ),
  );
  machine.next();
  return machine;
};
