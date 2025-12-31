import { describeHSM } from "matchina/hsm";
import { addEventApi, addStoreApi, setup, effect } from "matchina";
import { createComboboxStore } from "./store";

export function createComboboxMachine() {
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

  addEventApi(machine);

  // Component API - pure delegation, no coordination
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

    // Coordinated action: update store then transition
    setInput: (value: string) => {
      store.api.setInput(value);
      machine.api.type();
    },
  });

  return combobox;
}

export type ComboboxMachine = ReturnType<typeof createComboboxMachine>;
