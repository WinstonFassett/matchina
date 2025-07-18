import { createMachine, defineStates, enter, onLifecycle, setup, whenState, withApi } from "matchina";

export const createExtendedTrafficLightMachine = () => {
  const pedestrianStates = defineStates({
    Walk: undefined,
    DontWalk: undefined
  })
  const states = defineStates({
    Green: () => ({
      message: "Go",
      duration: 5000, // 5 seconds
      pedestrian: pedestrianStates.Walk(),
    }),
    Yellow: () => ({
      message: "Prepare to stop",
      duration: 2000, // 2 seconds
      pedestrian: pedestrianStates.DontWalk(),
    }),
    Red: () => ({
      message: "Stop",
      duration: 4000, // 4 seconds
      pedestrian: pedestrianStates.DontWalk(),
    }),
    RedWithPedestrianRequest: () => ({
      message: "Stop with pedestrian requesting crossing",
      duration: 2000, // 4 seconds
      pedestrian: pedestrianStates.DontWalk(),
    }),
  });

  const machine = Object.assign(
    withApi(createMachine(
      states,
      {
        Green: { next: "Yellow" },
        Yellow: { next: "Red" },
        Red: { 
          next: "Green",
          crossingRequested: "RedWithPedestrianRequest",
        },
      },
      "Red",
    )),
    {
      crossingRequested: false,
      requestCrossing: () => {
        machine.crossingRequested = true;
      },
    },
  );
  setup(machine)(
    enter(whenState("Red", (ev) => {
      if (machine.crossingRequested) {
        machine.api.crossingRequested()
        machine.crossingRequested = false;
      }
    }))
  )  
  return machine;
};

export type ExtendedTrafficLightMachine = ReturnType<
  typeof createExtendedTrafficLightMachine
>;
