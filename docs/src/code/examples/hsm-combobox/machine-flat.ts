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
              addTag: 'Empty',
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
              addTag: 'Empty',
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
              addTag: 'Empty',
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

  return Object.assign(flatMachine, { store });
}
