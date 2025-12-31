import { describeHSM } from "matchina/hsm";
import { setup } from "matchina";
import { createComboboxStoreHook } from "./hooks";
import { createComboboxStore } from "./store";

export function createFlatComboboxMachine() {
  const store = createComboboxStore();

  const flatMachine = describeHSM({
    initial: 'Inactive',
    states: {
      Inactive: {
        data: undefined,
        on: {
          focus: 'Active'
        }
      },
      Active: {
        initial: 'Empty',
        states: {
          Empty: {
            data: undefined,
            on: {
              typed: 'Typing',
              deactivate: '^Inactive'
            }
          },
          Typing: {
            data: undefined,
            on: {
              toEmpty: 'Empty',
              toSuggesting: 'Suggesting',
              toTextEntry: 'TextEntry',
              deactivate: '^Inactive'
            }
          },
          TextEntry: {
            data: undefined,
            on: {
              typed: 'Typing',
              clear: 'Empty',
              deactivate: '^Inactive'
            }
          },
          Suggesting: {
            data: undefined,
            on: {
              typed: 'Typing',
              clear: 'Empty',
              highlightNext: 'Suggesting',
              highlightPrev: 'Suggesting',
              selectHighlighted: 'Empty',
              cancel: 'TextEntry',
              deactivate: '^Inactive'
            }
          }
        },
        on: {
          deactivate: '^Inactive'
        }
      }
    }
  });

  setup(flatMachine)(
    createComboboxStoreHook(store)
  );

  // Expose store APIs on machine for direct access
  const machineWithStore = Object.assign(flatMachine, { 
    store,
    // Store APIs
    addTag: store.dispatch.bind(null, 'addTag'),
    removeTag: store.dispatch.bind(null, 'removeTag'),
    highlight: (direction: 'next' | 'prev') => store.dispatch('highlight', direction),
    selectHighlighted: () => store.dispatch('selectHighlighted'),
    clear: () => store.dispatch('clear'),
    deactivate: () => store.dispatch('deactivate')
  });

  return machineWithStore;
}
