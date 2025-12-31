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
            data: undefined,
            on: {
              type: 'Suggesting',
              blur: '^Inactive'
            }
          },
          Suggesting: {
            data: undefined,
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

  // Guard: block Empty→Suggesting if no suggestions
  setup(machine)(
    guard((ev) => {
      if (ev.type === 'type' && ev.from.key === 'Empty') {
        return store.getState().suggestions.length > 0;
      }
      return true;
    }),
    effect((ev: any) => {
      // Handle blur, select, dismiss (pure side effects)
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

    // Coordinated actions: store FIRST, machine SECOND (for proper guard timing)
    setInput: (value: string) => {
      store.api.setInput(value);  // FIRST - recomputes suggestions
      machine.api.type();         // THEN - guard sees updated suggestions
    },
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
