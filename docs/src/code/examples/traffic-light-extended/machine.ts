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
    Broken: () => ({
      message: "Broken (flashing red)",
      duration: 0,
      pedestrian: pedestrianStates.Error(),
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
        RedWithPedestrianRequest: {
          next: "Green",          
        },
      },
      "Red",
    )),
    {
      data: sharedState,
      requestCrossing: () => {
        console.log('request crossing')
        sharedState.send("change", {
          crossingRequested: true,
        })
        machine.send("crossingRequested")
      },
    },
  );
  let timer: NodeJS.Timeout | null = null;
  setup(machine)(
    enter(whenState("Red", (ev) => {
      const state = machine.data.getState();
      console.log('machine state', state)
      if (state.data.crossingRequested) {
        machine.api.crossingRequested()
        machine.data.send("change", {
          ...state, 
          crossingRequested: false,
        })
      }
    })),
    enter(ev => {
      console.log("Entering state:", ev.to.key);
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const duration = ev.to.data.duration;
      if (duration === 0) {
        return
      }
      timer = setTimeout(() => {
        console.log("Auto-transitioning from:", ev.to.key);
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
