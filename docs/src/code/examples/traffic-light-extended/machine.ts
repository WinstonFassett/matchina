import { change, effect, nanosubscriber } from "matchina";
import { createMachine, createTransitionMachine, defineStates, enter, onLifecycle, setup, type StateMachineEvent, whenState, withApi } from "matchina";

  interface State {
    crossingRequested?: boolean;
  }

function atom<T>(initialValue: T) {
  let value = initialValue;
  const [subscribe, emit] = nanosubscriber<T>();
  return {
    get: () => value,
    set: (newValue: T) => { 
      value = newValue; 
      emit(value);
    },
    update: (changes: Partial<T>) => {
      value = { ...value, ...changes };
      emit(value);
    },
    subscribe,
  };
}

export const createExtendedTrafficLightMachine = () => {
  const pedestrianStates = defineStates({
    Walk: undefined,
    DontWalk: undefined,
    Error: undefined
  })

  // const data = atom({
  //   // ok: true,
  //   crossingRequested: false,
  // })
  interface State {
    key: string,
    crossingRequested?: boolean;
    walkWarningDuration?: number;
  }

  // const sharedState = createTransitionMachine<StateMachineEvent<State, State>>(
  //   {
  //     State: { change: "State" },
  //   }, 
  //   { key: "State", crossingRequested: false } 
  // )

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

  const walkDuration = 
    states.Green().data.duration +
    states.Yellow().data.duration

    
  const greenWalkWarnAt = walkDuration - states.Yellow().data.duration - states.Green().data.duration / 2;
  const yellowWalkWarnAt = 0 //states.Yellow().data.duration;
  
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
        // console.log('request crossing')
        sharedState.send("change", {
          crossingRequested: true,
        })
        machine.send("crossingRequested")
      },
    },
  );
  let timer: NodeJS.Timeout | null = null;
  let walkWarnTimer: NodeJS.Timeout | null = null;
  setup(machine)(
    // enter(whenState("Green", (ev) => {
      
    // })),
    enter(whenState("Red", (ev) => {      
      const state = machine.data.getState();
      // console.log('machine state', state)
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
      console.log("Entering state:", ev.to.key);
      if (walkWarnTimer) {
        clearTimeout(walkWarnTimer);
        walkWarnTimer = null;
      }
      // if (ev.to.key !== "Yellow") {
      //   if (sharedState.getState().data.walkWarningDuration) {
      //     sharedState.send("change", {
      //       walkWarningDuration: 0,
      //     })
      //   }
      // } 
      // // if (ev.to.key === "Green") {
      // //   walkWarnTimer = setTimeout(() => {
      // //     sharedState.send("change", {
      // //       walkWarningDuration,
      // //     })
      // //   }, walkWarnAt)
      // // } 

      // update pedestrian timer
      if (ev.to.is("Red") ) {
        sharedState.send("change", {
          walkWarningDuration: 0,
        })
        // if (walkWarnTimer) {
        //   clearTimeout(walkWarnTimer);
        //   walkWarnTimer = null;
        // }
      } else {
        const walkWarnAt = 
          ev.to.is("Green") ? greenWalkWarnAt : 
          ev.to.is("Yellow") ? yellowWalkWarnAt : -1;
        console.log("walkWarnAt", walkWarnAt, "for state:", ev.to.key);
        if (walkWarnAt > -1) {
          const walkWarningDuration = 
            ev.to.is("Green") ? walkDuration - greenWalkWarnAt :
            ev.to.is("Yellow") ? states.Yellow().data.duration - yellowWalkWarnAt : 0;
          console.log("Setting walk warning duration for state:", ev.to.key, "for duration:", walkWarningDuration);
          walkWarnTimer = setTimeout(() => {
            // console.log("Setting walk warning duration for state:", ev.to.key, "for duration:", walkWarnAt);
            sharedState.send("change", {
              walkWarningDuration
            })
          }, walkWarnAt);
        }
        // sharedState.send("change", {
        //   walkWarningDuration,
        // })
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
      // console.log("Setting timer for state:", ev.to.key, "for duration:", duration);
      timer = setTimeout(() => {
        // console.log("Auto-transitioning from:", ev.to.key);
        machine.api.next();
      }, duration);
      // return () => {
      //   console.log("Exiting state:", ev.from.key);        
      //   clearTimeout(timer);
      // }
    })
  )  
  // start it
  machine.send('next')
  return machine;
};

export type ExtendedTrafficLightMachine = ReturnType<
  typeof createExtendedTrafficLightMachine
>;
