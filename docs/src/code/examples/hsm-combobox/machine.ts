import { defineStates, matchina } from "matchina";
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
      removeTag: (tag) => (ev) => 
        activeStates.Empty(),
      backspace: () => (ev) => {
        return ev.from;
      },
    },
    Typing: {
      removeTag: (tag) => (ev) => 
        activeStates.Typing(),
      backspace: () => (ev) => {
        return ev.from;
      },
    },
    TextEntry: {
      typed: handleTyped,
      clear: () => (ev) => activeStates.Empty(),
      addTag: handleAddTag,
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
      addTag: handleAddTag,
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
      blur: () => (ev) => {
        const activeMachine = ev.from.data.machine;
        const activeState = activeMachine?.getState();
        const selectedTags = activeState?.data?.selectedTags ?? [];
        return appStates.Inactive();
      },
      close: () => (ev: any) => {
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

  return Object.assign(hierarchical, { store });
}
