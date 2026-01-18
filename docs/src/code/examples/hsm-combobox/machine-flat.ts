import { createHSM } from "matchina/hsm";
import { setup, effect, addEventApi, addStoreApi } from "matchina";
import { createComboboxStore } from "./store";

export function createFlatComboboxMachine() {
  const store = addStoreApi(createComboboxStore());

  // HSM: Inactive, Active.Empty, Active.Suggesting
  const machine = createHSM({
    initial: "Inactive",
    states: {
      Inactive: {
        on: {
          focus: "Active",
        },
      },
      Active: {
        initial: "Empty",
        states: {
          Empty: {},
          Suggesting: {
            on: {
              select: "Empty",
            },
          },
        },
        on: {
          type: "Suggesting",
          blur: "^Inactive",
        },
      },
    },
  });

  // Effects coordinate machine transitions with store updates
  setup(machine)(
    effect((ev: any) => {
      if (ev.type === "select") store.api.selectHighlighted();
      if (ev.type === "blur") store.api.clear();
    })
  );

  // Add event API to machine
  addEventApi(machine);

  // Component-level API - all actions go through machine, effects coordinate
  const combobox = Object.assign(machine, {
    model: store,

    // Machine state transitions (exposed directly)
    focus: () => machine.send("focus"),
    blur: () => machine.send("blur"),
    select: () => machine.send("select"),

    // Store operations that update state and trigger machine events
    setInput: (input: string) => {
      store.api.setInput(input);
      machine.send("type");
    },

    addTag: (tag: string) => {
      store.api.addTag(tag);
    },

    // Pure store operations (no machine events)
    removeTag: store.api.removeTag,
    highlight: store.api.highlight,
    setHighlighted: store.api.setHighlighted,

    // Convenience methods that combine store + machine
    selectSuggestion: () => {
      store.api.selectHighlighted();
      machine.send("select");
    },

    dismiss: () => {
      machine.send("select");
    },
  });

  return combobox;
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
