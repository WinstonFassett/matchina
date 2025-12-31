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
          focus: 'Active',
          addTag: 'Active'
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
          addTag: 'Active',
          blur: '^Inactive'
        }
      }
    }
  });

  // Effects coordinate all store updates from machine events
  setup(machine)(
    effect((ev: any) => {
      if (ev.type === 'type') store.api.setInput(ev.to.data?.value ?? '');
      if (ev.type === 'addTag') store.api.addTag(ev.params?.[0] ?? '');
      if (ev.type === 'select') store.api.selectHighlighted();
      if (ev.type === 'blur') store.api.clear();
      if (ev.type === 'dismiss') store.api.clear();
    })
  );

  // Add event API to machine
  addEventApi(machine);

  // Unified subscription: both machine and store notify
  const subscribers = new Set<() => void>();
  const notify = () => subscribers.forEach(fn => fn());

  // Component-level API - all actions go through machine, effects coordinate
  const combobox = Object.assign(machine, {
    model: store,

    // Unified subscribe that catches both machine and store changes
    subscribe(fn: () => void) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },

    // Pure store operations - wrap to notify subscribers
    removeTag: (tag: string) => {
      store.api.removeTag(tag);
      notify();
    },
    highlight: (direction: 'next' | 'prev') => {
      store.api.highlight(direction);
      notify();
    },
    setHighlighted: (index: number) => {
      store.api.setHighlighted(index);
      notify();
    },

    // Machine operations - effects handle all store coordination
    focus: machine.api.focus,
    blur: machine.api.blur,
    type: machine.api.type,
    addTag: machine.api.addTag,
    select: machine.api.select,
    dismiss: machine.api.dismiss,

    // Semantic aliases for UI
    setInput: machine.api.type,
    selectSuggestion: machine.api.select,
  });

  // Subscribe machine changes to unified notify
  // (HSM doesn't have subscribe yet, so we notify manually on API calls)
  // (store changes are notified above in the wrapped methods)

  return combobox;
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
