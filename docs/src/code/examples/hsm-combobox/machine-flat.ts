import { describeHSM } from "matchina/hsm";
import { setup, effect } from "matchina";
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

  // Minimal hook - only handle typed events for auto-transitions
  setup(flatMachine)(effect((ev: any) => {
    if (ev?.type === 'typed' && ev?.params?.[0] !== undefined) {
      setTimeout(() => {
        const state = store.getState();
        ev.machine?.send?.(state.suggestions.length > 0 ? "toSuggesting" : "toTextEntry");
      }, 0);
    }
  }));

  // Expose store APIs on machine for direct access
  const machineWithStore = Object.assign(flatMachine, { 
    store,
    // Store APIs
    addTag: store.dispatch.bind(null, 'addTag'),
    removeTag: store.dispatch.bind(null, 'removeTag'),
    setInput: store.dispatch.bind(null, 'setInput'),
    highlight: (direction: 'next' | 'prev') => store.dispatch('highlight', direction),
    clear: () => store.dispatch('clear'),
    deactivate: () => store.dispatch('clear')
  });

  return machineWithStore;
}
