import { createMachine, defineStates, enter, setup, whenState, withApi } from "matchina";

 const pedestrianStates = defineStates({
    Walk: undefined,
    DontWalk: undefined,
    Error: undefined
  })

  interface State {
    key: string,
    crossingRequested?: boolean;
    walkWarningDuration?: number;
  }

  const sharedStates = defineStates({
      State: (state: State = { key: "State", crossingRequested: false }) => state,
  })

  const sharedState = createMachine(
    sharedStates,
    {
      State: {
        change: (changes: Partial<State>) => (ev) => (sharedStates.State({
          ...ev.from.data,
          ...changes
        })),
      },
    },
    sharedStates.State({ key: "State", crossingRequested: false })
  )

  const states = defineStates({
    Green: () => ({
      message: "Go",
      duration: 4000, // 3 seconds
      pedestrian: pedestrianStates.Walk(),
    }),
    Yellow: () => ({
      message: "Prepare to stop",
      duration: 2000, // 2 seconds
      pedestrian: pedestrianStates.Walk(),
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
    Broken: () => ({
      message: "Broken (flashing red)",
      duration: 0,
      pedestrian: pedestrianStates.Error(),
    }),
  });


export const walkDuration = 
  states.Green().data.duration +
  states.Yellow().data.duration
  
export const greenWalkWarnAt = walkDuration - states.Yellow().data.duration - states.Green().data.duration / 2;
export const yellowWalkWarnAt = 0 //states.Yellow().data.duration;

export const createExtendedTrafficLightMachine = () => {   
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
        RedWithPedestrianRequest: {
          next: "Green",          
        },
      },
      "Red",
    )),
    {
      data: sharedState,
      requestCrossing: () => {
        sharedState.send("change", { crossingRequested: true })
        machine.send("crossingRequested")
      },
    },
  );
  let timer: NodeJS.Timeout | null = null;
  let walkWarnTimer: NodeJS.Timeout | null = null;
  setup(machine)(
    enter(whenState("Red", (ev) => {      
      const state = machine.data.getState();
      if (state.data.crossingRequested) {
        queueMicrotask(machine.api.crossingRequested)        
      }
    })),
    enter(whenState("RedWithPedestrianRequest", (ev) => {
      machine.data.send("change", {
        crossingRequested: false,
      })
    })),
    enter(ev => {
      if (walkWarnTimer) {
        clearTimeout(walkWarnTimer);
        walkWarnTimer = null;
      }

      // update pedestrian timer
      if (ev.to.is("Red") ) {
        sharedState.send("change", {
          walkWarningDuration: 0,
        })
      } else {
        const walkWarnAt = 
          ev.to.is("Green") ? greenWalkWarnAt : 
          ev.to.is("Yellow") ? yellowWalkWarnAt : -1;
        if (walkWarnAt > -1) {
          const walkWarningDuration = 
            ev.to.is("Green") ? walkDuration - greenWalkWarnAt :
            ev.to.is("Yellow") ? states.Yellow().data.duration - yellowWalkWarnAt : 0;
          walkWarnTimer = setTimeout(() => {
            sharedState.send("change", { walkWarningDuration })
          }, walkWarnAt);
        }
      }

      // update timer
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const duration = ev.to.data.duration;
      if (duration === 0) {
        return
      }
      timer = setTimeout(() => {
        machine.api.next();
      }, duration);
    })
  )  
  // start it
  machine.send('next')
  return machine;
};

export type ExtendedTrafficLightMachine = ReturnType<
  typeof createExtendedTrafficLightMachine
>;
