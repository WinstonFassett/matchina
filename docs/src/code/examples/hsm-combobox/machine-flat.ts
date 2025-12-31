import { describeHSM } from "matchina/hsm";
import { setup, effect, addEventApi } from "matchina";
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
    console.log('Flat hook received:', ev.type, ev.params);
    if (ev?.type === 'typed') {
      setTimeout(() => {
        const state = store.getState();
        console.log('Auto-transition - suggestions:', state.suggestions.length);
        ev.machine?.send?.(state.suggestions.length > 0 ? "toSuggesting" : "toTextEntry");
      }, 0);
    }
  }));

  // Expose store APIs on machine for direct access
  const machineWithStore = Object.assign(flatMachine, { 
    store,
    // Store APIs
    addTag: (tag: string) => store.dispatch('addTag', tag),
    removeTag: (tag: string) => store.dispatch('removeTag', tag),
    setInput: (input: string) => store.dispatch('setInput', input),
    highlight: (direction: 'next' | 'prev') => store.dispatch('highlight', direction),
    clear: () => store.dispatch('clear'),
    deactivate: () => store.dispatch('clear')
  });

  // Add event API to machine
  addEventApi(machineWithStore);

  return machineWithStore;
}
