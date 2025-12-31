import { describeHSM } from "matchina/hsm";
import { setup, effect, addEventApi, addStoreApi } from "matchina";
import { createComboboxStore } from "./store";

export function createFlatComboboxMachine() {
  const store = addStoreApi(createComboboxStore());

  // HSM: Inactive, Active.Empty, Active.Suggesting
  const machine = describeHSM({
    initial: 'Inactive',
    states: {
      Inactive: {
        on: {
          focus: 'Active'
        }
      },
      Active: {
        initial: 'Empty',
        states: {
          Empty: {
            on: {
              type: 'Suggesting'
            }
          },
          Suggesting: {
            on: {
              type: 'Suggesting',
              select: 'Empty'
            }
          }
        },
        on: {
          blur: '^Inactive'
        }
      }
    }
  });

  // Effects coordinate machine transitions with store updates
  setup(machine)(
    effect((ev: any) => {
      if (ev.type === 'select') store.api.selectHighlighted();
      if (ev.type === 'blur') store.api.clear();
    })
  );

  // Add event API to machine
  addEventApi(machine);

  // Component-level API - all actions go through machine, effects coordinate
  const combobox = Object.assign(machine, {
    model: store,

    // Pure store operations
    removeTag: store.api.removeTag,
    highlight: store.api.highlight,
    setHighlighted: store.api.setHighlighted,

    // Machine operations
    focus: () => machine.send('focus'),
    blur: () => machine.send('blur'),
    addTag: () => machine.send('addTag'),
    select: () => machine.send('select'),

    // Coordinated action: update store then transition
    setInput: (value: string) => {
      store.api.setInput(value);
      machine.send('type');
    },
  });

  return combobox;
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
