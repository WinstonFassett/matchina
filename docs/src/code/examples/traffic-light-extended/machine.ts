import { createMachine, defineStates, onLifecycle, withApi } from "matchina";

export const createExtendedTrafficLightMachine = () => {
  // Define states with messages and pedestrian info
  const states = defineStates({
    Green: () => ({ 
      message: 'Traffic: Go',
      pedestrianSignal: 'dontWalk',
      pedestrianRequested: false
    }),
    Yellow: () => ({ 
      message: 'Traffic: Prepare to stop',
      pedestrianSignal: 'dontWalk',
      pedestrianRequested: false
    }),
    Red: () => ({ 
      message: 'Traffic: Stop',
      pedestrianSignal: 'dontWalk',
      pedestrianRequested: false
    }),
    RedWithPedestrian: () => ({ 
      message: 'Traffic: Stop',
      pedestrianSignal: 'walk',
      pedestrianRequested: false
    }),
    PedestrianFlashing: () => ({
      message: 'Traffic: Stop',
      pedestrianSignal: 'flashing',
      pedestrianRequested: false
    })
  });
  
  // Create a machine with transitions
  const machine = withApi(createMachine(
    states,
    {
      Green: { 
        next: 'Yellow'
      },
      Yellow: { 
        next: 'Red'
      },
      Red: { 
        next: function(s) {
          return s.data.pedestrianRequested ? states.RedWithPedestrian() : states.Green();
        }
      },
      RedWithPedestrian: {
        next: 'PedestrianFlashing'
      },
      PedestrianFlashing: {
        next: 'Green'
      }
    },
    'Red'
  ));
  
  // Add pedestrian button functionality directly to the machine
  Object.assign(machine.api, {
    pedestrianButton: () => {
      const currentState = machine.getState();
      currentState.data.pedestrianRequested = true;
      return currentState;
    }
  });
  
  return machine;
};

export type ExtendedTrafficLightMachine = ReturnType<typeof createExtendedTrafficLightMachine>;
