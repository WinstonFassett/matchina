import { defineStates, matchina, setup, effect, addEventApi } from "matchina";
import { submachine, makeHierarchical } from "matchina/hsm";
import { createComboboxStore } from "./store";

export const activeStates = defineStates({
  Empty: undefined,
  Typing: undefined,
  TextEntry: undefined,
  Suggesting: undefined,
});

function createActiveForApp() {
  return matchina(activeStates, {
    Empty: {
      typed: "Typing",
    },
    Typing: {
      toEmpty: "Empty",
      toSuggesting: "Suggesting",
      toTextEntry: "TextEntry",
    },
    TextEntry: {
      typed: "Typing",
      clear: "Empty",
    },
    Suggesting: {
      typed: "Typing",
      clear: "Empty",
      highlightNext: "Suggesting",
      highlightPrev: "Suggesting",
      selectHighlighted: "Empty",
      cancel: "TextEntry",
    },
  }, "Empty");
}

export type ActiveMachine = ReturnType<typeof createActiveForApp>;

const activeMachineFactory = submachine(createActiveForApp, { id: "active" });

export const appStates = defineStates({
  Inactive: undefined,
  Active: activeMachineFactory,
});

export function createComboboxMachine() {
  const store = createComboboxStore();

  const combobox = matchina(appStates, {
    Inactive: { focus: "Active" },
    Active: { deactivate: "Inactive" },
  }, appStates.Inactive());

  const hierarchical = makeHierarchical(combobox);
  
  // Minimal hook - only handle typed events for auto-transitions
  setup(hierarchical)(effect((ev: any) => {
    console.log('Nested hook received:', ev.type, ev.params);
    if (ev?.type === 'typed') {
      setTimeout(() => {
        const state = store.getState();
        console.log('Auto-transition - suggestions:', state.suggestions.length);
        ev.machine?.send?.(state.suggestions.length > 0 ? "toSuggesting" : "toTextEntry");
      }, 0);
    }
  }));

  const machineWithStore = Object.assign(hierarchical, { 
    store,
    // Store APIs
    addTag: (tag: string) => store.dispatch('addTag', tag),
    removeTag: (tag: string) => store.dispatch('removeTag', tag),
    setInput: (input: string) => store.dispatch('setInput', input),
    highlight: (d: 'next' | 'prev') => store.dispatch('highlight', d),
    clear: () => store.dispatch('clear'),
    deactivate: () => store.dispatch('clear')
  });

  // Add event API to machine
  addEventApi(machineWithStore);

  return machineWithStore;
}
