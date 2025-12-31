import { describeHSM } from 'matchina/hsm';

export function createTrafficLightMachine() {
  return describeHSM({
    initial: 'Red',
    states: {
      Red: {
        on: {
          Timer: 'Green',
          Emergency: 'Flashing'
        }
      },
      Yellow: {
        on: {
          Timer: 'Red',
          Emergency: 'Flashing'
        }
      },
      Green: {
        on: {
          Timer: 'Yellow',
          Emergency: 'Flashing'
        }
      },
      Flashing: {
        on: {
          Reset: 'Red'
        }
      }
    }
  });
}