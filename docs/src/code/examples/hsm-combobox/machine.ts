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
  return activeStates.Typing();
};

const handleAddTag = (tag: string) => (ev: any) => {
  return activeStates.Empty();
};

function createActiveForApp() {
  return matchina(activeStates, {
    Empty: {
      typed: (value: string) => (ev: any) => {
        if (!value.trim()) return activeStates.Empty();
        return activeStates.Typing();
      },
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
      typed: (value: string) => (ev: any) => {
        if (!value.trim()) return activeStates.Empty();
        return activeStates.Typing();
      },
      clear: () => (ev) => activeStates.Empty(),
      backspace: () => (ev) => {
        return ev.from;
      },
    },
    Suggesting: {
      typed: (value: string) => (ev: any) => {
        if (!value.trim()) return activeStates.Empty();
        return activeStates.Typing();
      },
      clear: () => (ev) => activeStates.Empty(),
      cancel: () => (ev) => activeStates.TextEntry(),
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
