import { createDeclarativeFlatMachine } from "matchina";

export function createFlatTrafficLight() {
  return createDeclarativeFlatMachine({
    initial: 'Working',
    states: {
      Broken: {
        data: undefined,
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
            data: undefined,
            on: {
              tick: 'Green'
            }
          },
          Green: {
            data: undefined,
            on: {
              tick: 'Yellow'
            }
          },
          Yellow: {
            data: undefined,
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
        data: undefined,
        on: {
          complete: 'Working'
        }
      }
    }
  });
}

// Helper to parse hierarchical state key
export function parseFlatStateKey(key: string) {
  const parts = key.split(".");
  return {
    parent: parts[0],
    child: parts[1] || null,
    full: key,
  };
}
