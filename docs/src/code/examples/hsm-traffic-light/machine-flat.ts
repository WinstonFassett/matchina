import { createHierarchicalMachine } from "matchina";

export function createFlatTrafficLight() {
  return createHierarchicalMachine({
    initial: 'Working',
    states: {
      Broken: {
        on: {
          repair: 'Working',
          maintenance: 'Maintenance'
        }
      },

      // Working is a hierarchical state with light cycle substates
      Working: {
        initial: 'Red',
        states: {
          Red: {
            on: {
              tick: 'Green'
            }
          },
          Green: {
            on: {
              tick: 'Yellow'
            }
          },
          Yellow: {
            on: {
              tick: 'Red'
            }
          }
        },
        // Parent-level transitions apply to all child states
        on: {
          break: '^Broken',
          maintenance: '^Maintenance'
        }
      },

      Maintenance: {
        on: {
          complete: 'Working'
        }
      }
    }
  });
}
