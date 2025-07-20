import { createMachine, enter, setup, whenState, withApi } from "matchina";
import { states, sharedStates, type CommonStateProps } from "./states";

export const walkDuration =
  states.Green().data.duration + states.Yellow().data.duration;

export const greenWalkWarnAt =
  walkDuration -
  states.Yellow().data.duration -
  states.Green().data.duration / 2;
export const yellowWalkWarnAt = 0; //states.Yellow().data.duration;

const sharedState = createMachine(
  sharedStates,
  {
    State: {
      change: (changes: Partial<CommonStateProps>) => (ev) =>
        sharedStates.State({
          ...ev.from.data,
          ...changes,
        }),
    },
  },
  sharedStates.State({ key: "State", crossingRequested: false }),
);

// Common transitions that all normal states can use
const commonTransitions = {
  emergency: "FlashingYellow",
  malfunction: "FlashingRed",
} as const;

export const createExtendedTrafficLightMachine = () => {
  // Create the base machine with transitions
  const baseMachine = createMachine(
    states,
    {
      Green: {
        next: "Yellow",
        ...commonTransitions,
      },
      Yellow: {
        next: "Red",
        ...commonTransitions,
      },
      Red: {
        next: "Green",
        crossingRequested: "RedWithPedestrianRequest",
        ...commonTransitions,
      },
      RedWithPedestrianRequest: {
        next: "Green",
        ...commonTransitions,
      },
      FlashingYellow: {
        reset: "Red",
      },
      FlashingRed: {
        reset: "Red",
      },
    },
    "Red",
  );

  // Simple and clean with withApi
  const machine = Object.assign(withApi(baseMachine), {
    data: sharedState,
    requestCrossing: () => {
      sharedState.send("change", { crossingRequested: true });
      machine.api.crossingRequested();
    },
  });

  let timer: NodeJS.Timeout | null = null;
  let walkWarnTimer: NodeJS.Timeout | null = null;

  setup(machine)(
    enter(
      whenState("Red", (ev) => {
        const state = machine.data.getState();
        if (state.data.crossingRequested) {
          queueMicrotask(machine.api.crossingRequested);
        }
      }),
    ),
    enter(
      whenState("RedWithPedestrianRequest", (ev) => {
        machine.data.send("change", {
          crossingRequested: false,
        });
      }),
    ),
    enter((ev) => {
      if (walkWarnTimer) {
        clearTimeout(walkWarnTimer);
        walkWarnTimer = null;
      }

      // update pedestrian timer
      if (ev.to.is("Red")) {
        sharedState.send("change", {
          walkWarningDuration: 0,
        });
      } else {
        const walkWarnAt = ev.to.is("Green")
          ? greenWalkWarnAt
          : ev.to.is("Yellow")
            ? yellowWalkWarnAt
            : -1;
        if (walkWarnAt > -1) {
          const walkWarningDuration = ev.to.is("Green")
            ? walkDuration - greenWalkWarnAt
            : ev.to.is("Yellow")
              ? states.Yellow().data.duration - yellowWalkWarnAt
              : 0;
          walkWarnTimer = setTimeout(() => {
            sharedState.send("change", { walkWarningDuration });
          }, walkWarnAt);
        }
      }

      // update timer for normal states (not flashing states)
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      const duration = ev.to.data.duration;
      if (duration === 0) {
        return;
      }
      timer = setTimeout(() => {
        machine.api.next();
      }, duration);
    }),
  );
  // start it
  machine.send("next");
  return machine;
};

export type ExtendedTrafficLightMachine = ReturnType<
  typeof createExtendedTrafficLightMachine
>;
