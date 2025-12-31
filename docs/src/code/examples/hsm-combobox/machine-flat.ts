import { describeHSM } from "matchina/hsm";
import { setup } from "matchina";
import { createComboboxStoreHook } from "./hooks";
import { createComboboxStore } from "./store";

// Create the automatically flattened version using describeHSM
export function createFlatComboboxMachine() {
  // Use shared store instead of creating a new one
  const store = createComboboxStore();

  // Use describeHSM to auto-flatten a nested description
  const flatMachine = describeHSM({
    initial: 'Inactive',
    states: {
      Inactive: {
        data: undefined, // No data needed - everything is in store
        on: {
          focus: 'Active'
        }
      },
      Active: {
        initial: 'Empty',
        states: {
          Empty: {
            data: undefined, // No data needed - everything is in store
            on: {
              typed: 'Typing',
              removeTag: 'Empty', // Stay in Empty
              addTag: 'Empty', // Stay in Empty
              deactivate: '^Inactive'
            }
          },
          Typing: {
            data: undefined, // No data needed - everything is in store
            on: {
              // Auto-transition based on suggestions
              toEmpty: 'Empty',
              toSuggesting: 'Suggesting',
              toTextEntry: 'TextEntry',
              removeTag: 'Typing',
              deactivate: '^Inactive'
            }
          },
          TextEntry: {
            data: undefined, // No data needed - everything is in store
            on: {
              typed: 'Typing',
              clear: 'Empty',
              removeTag: 'TextEntry',
              addTag: 'Empty',
              deactivate: '^Inactive'
            }
          },
          Suggesting: {
            data: undefined, // No data needed - everything is in store
            on: {
              typed: 'Typing',
              clear: 'Empty',
              highlightNext: 'Suggesting',
              highlightPrev: 'Suggesting',
              selectHighlighted: 'Empty',
              removeTag: 'Suggesting',
              cancel: 'TextEntry',
              addTag: 'Empty',
              deactivate: '^Inactive'
            }
          }
        },
        on: {
          blur: '^Inactive',
          close: '^Inactive',
          removeTag: () => (ev) => {
            // Delegate to child machine - let it handle the event
            return ev.from;
          }
        }
      }
    }
  });

  // Add store hook and auto-transition effect
  setup(flatMachine)(
    createComboboxStoreHook(store)
  );

  // Attach store to machine for external access
  return Object.assign(flatMachine, { store });
}
