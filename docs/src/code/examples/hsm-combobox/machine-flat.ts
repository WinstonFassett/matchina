import { describeHSM } from "matchina/hsm";
import { setup, guard, effect, addEventApi, addStoreApi } from "matchina";
import { createComboboxStore } from "./store";

export function createFlatComboboxMachine() {
  const store = addStoreApi(createComboboxStore());

  // HSM: Inactive, Active.Empty, Active.Suggesting
  const machine = describeHSM({
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
            data: (value: string) => ({ value }),
            on: {
              type: 'Suggesting',
              blur: '^Inactive'
            }
          },
          Suggesting: {
            data: (value: string) => ({ value }),
            on: {
              type: 'Suggesting',
              select: 'Empty',
              dismiss: 'Empty',
              blur: '^Inactive'
            }
          }
        },
        on: {
          blur: '^Inactive'
        }
      }
    }
  });

  // No guard - just coordinate store updates
  setup(machine)(
    effect((ev: any) => {
      if (ev.type === 'type') store.api.setInput(ev.to.data?.value ?? '');
      if (ev.type === 'blur') store.api.clear();
      if (ev.type === 'select') store.api.selectHighlighted();
      if (ev.type === 'dismiss') store.api.clear();
    })
  );

  // Add event API to machine
  addEventApi(machine);

  // Component-level API
  const combobox = Object.assign(machine, {
    model: store,

    // Store operations (no machine involvement)
    removeTag: store.api.removeTag,
    highlight: store.api.highlight,
    setHighlighted: store.api.setHighlighted,

    // Pure machine operations
    focus: machine.api.focus,
    blur: machine.api.blur,
    dismiss: machine.api.dismiss,

    // Machine events - effects coordinate store updates
    setInput: (value: string) => machine.api.type(value),
    selectSuggestion: () => {
      store.api.selectHighlighted();
      machine.api.select();
    },
    addTag: (tag: string) => {
      store.api.addTag(tag);
    },
  });

  return combobox;
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
