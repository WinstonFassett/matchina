import { defineStates, matchina, setup } from "matchina";
import { submachine, makeHierarchical } from "matchina/hsm";
import { createComboboxStoreHook } from "./hooks";
import { createComboboxStore } from "./store";

const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

export const activeStates = defineStates({
  Empty: undefined,
  Typing: undefined,
  TextEntry: undefined,
  Suggesting: undefined,
});

function getSuggestions(input: string, selectedTags: string[]): string[] {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return [];

  return AVAILABLE_TAGS
    .filter(tag =>
      tag.toLowerCase().includes(trimmed) &&
      !selectedTags.includes(tag)
    )
    .slice(0, 5);
}

const handleTyped = (value: string) => (ev: any) => {
  if (!value.trim()) return activeStates.Empty();
  return activeStates.TextEntry();
};

const handleAddTag = (tag: string) => (ev: any) => {
  return activeStates.Empty();
};

function createActiveForApp() {
  return matchina(activeStates, {
    Empty: {
      typed: handleTyped,
      backspace: () => (ev) => {
        return ev.from;
      },
    },
    Typing: {
      backspace: () => (ev) => {
        return ev.from;
      },
    },
    TextEntry: {
      typed: handleTyped,
      clear: () => (ev) => activeStates.Empty(),
      backspace: () => (ev) => {
        return ev.from;
      },
    },
    Suggesting: {
      typed: handleTyped,
      clear: () => (ev) => activeStates.Empty(),
      highlightNext: () => (ev) => {
        return activeStates.Suggesting();
      },
      highlightPrev: () => (ev) => {
        return activeStates.Suggesting();
      },
      selectHighlighted: () => (ev) => {
        return activeStates.Empty();
      },
      cancel: () => (ev) => {
        return activeStates.TextEntry();
      },
      backspace: () => (ev) => {
        return ev.from;
      },
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
    Inactive: {
      focus: "Active"
    },
    Active: {
      deactivate: () => (ev) => {
        const activeMachine = ev.from.data.machine;
        const activeState = activeMachine?.getState();
        const selectedTags = activeState?.data?.selectedTags ?? [];
        return appStates.Inactive();
      },
    },
  }, appStates.Inactive());

  const hierarchical = makeHierarchical(combobox);

  setup(hierarchical)(
    createComboboxStoreHook(store)
  );

  // Expose store APIs on machine for direct access
  const machineWithStore = Object.assign(hierarchical, { 
    store,
    // Store APIs
    addTag: store.dispatch.bind(null, 'addTag'),
    removeTag: store.dispatch.bind(null, 'removeTag'),
    highlight: (direction: 'next' | 'prev') => store.dispatch('highlight', direction),
    selectHighlighted: () => store.dispatch('selectHighlighted'),
    clear: () => store.dispatch('clear'),
    deactivate: () => store.dispatch('deactivate')
  });

  return machineWithStore;
}
