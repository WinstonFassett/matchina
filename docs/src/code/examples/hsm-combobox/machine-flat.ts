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
      // Coordinate store updates based on machine events
      if (ev.type === 'type') store.api.setInput(ev.params?.[0] ?? '');
      if (ev.type === 'blur') store.api.clear();
      if (ev.type === 'select') store.api.selectHighlighted();
      if (ev.type === 'dismiss') store.api.clear();
    })
  );

  // Add event API to machine
  addEventApi(machine);

  // Component-level API - no wrapper functions, just expose what's needed
  const combobox = Object.assign(machine, {
    model: store,

    // Store operations (UI calls these when it needs store changes only)
    removeTag: store.api.removeTag,
    highlight: store.api.highlight,
    setHighlighted: store.api.setHighlighted,

    // Machine operations + coordinated via effects
    focus: machine.api.focus,
    blur: machine.api.blur,
    type: machine.api.type,  // effect coordinates store.setInput
    select: machine.api.select,  // effect coordinates store.selectHighlighted
    dismiss: machine.api.dismiss,  // effect coordinates store.clear

    // Semantic aliases for the UI
    setInput: machine.api.type,
    selectSuggestion: machine.api.select,
    addTag: (tag: string) => store.api.addTag(tag),
  });

  return combobox;
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
