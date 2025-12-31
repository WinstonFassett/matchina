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
              select: 'Empty',
              dismiss: 'Empty'
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
      if (ev.type === 'dismiss') store.api.clear();
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
    focus: machine.api.focus,
    blur: machine.api.blur,
    type: machine.api.type,
    addTag: machine.api.addTag,
    select: machine.api.select,
    dismiss: machine.api.dismiss,

    // Coordinated action: update store then transition
    setInput: (value: string) => {
      store.api.setInput(value);
      machine.api.type();
    },
  });

  return combobox;
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
