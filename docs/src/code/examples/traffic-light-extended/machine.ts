import { createMachine, defineStates, onLifecycle, withApi } from "matchina";

export const createExtendedTrafficLightMachine = () => {
  // Define states with messages and pedestrian info
  const states = defineStates({
    Green: () => ({ 
      message: 'Go',
      pedestrianMessage: 'Do not cross'
    }),
    Yellow: () => ({ 
      message: 'Prepare to stop',
      pedestrianMessage: 'Do not cross'
    }),
    Red: () => ({ 
      message: 'Stop',
      pedestrianMessage: 'Wait'
    }),
    RedWithPedestrian: () => ({ 
      message: 'Stop',
      pedestrianMessage: 'Cross now'
    })
  });
  
  // Create a machine with transitions
  const machine = withApi(createMachine(
    states,
    {
      Green: { 
        next: 'Yellow',
        pedestrianButton: 'Yellow' // Pressing button while green just continues normal cycle
      },
      Yellow: { 
        next: 'Red',
        pedestrianButton: 'Red' // Pressing button while yellow just continues normal cycle
      },
      Red: { 
        next: 'Green',
        pedestrianButton: 'RedWithPedestrian' // Allow pedestrian crossing
      },
      RedWithPedestrian: {
        next: 'Green' // After pedestrian time, go back to green
      }
    },
    states.Red() // Start with red light
  ));
  
  return machine;
};

export type ExtendedTrafficLightMachine = ReturnType<typeof createExtendedTrafficLightMachine>;
