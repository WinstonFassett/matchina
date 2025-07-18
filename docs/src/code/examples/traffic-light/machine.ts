import { createMachine, defineStates, withApi } from "matchina";

export const createTrafficLightMachine = () => {

  const states = defineStates({
    Green: () => ({ message: 'Go' }),
    Yellow: () => ({ message: 'Prepare to stop' }),
    Red: () => ({ message: 'Stop' })
  });
  
  const machine = withApi(createMachine(
    states,
    {
      Green: { next: 'Yellow' },
      Yellow: { next: 'Red' },
      Red: { next: 'Green' }
    },
    'Red'
  ));
  
  return machine;
};

export type TrafficLightMachine = ReturnType<typeof createTrafficLightMachine>;
