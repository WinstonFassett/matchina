import { defineStates, matchina } from "matchina";
import { submachine, makeHierarchical } from "matchina/hsm";

// Available options for autocomplete
const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];


// Active child states for the tag editor
export const activeStates = defineStates({
  Empty: () => ({
    input: "",
    // selectedTags is in store, not machine state
  }),
  TextEntry: (input: string) => ({
    input,
    // selectedTags is in store, not machine state
  }),
  Suggesting: (input: string, suggestions: string[], highlightedIndex: number = 0) => ({
    input,
    suggestions,
    highlightedIndex
    // selectedTags is in store, not machine state
  }),
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

// Shared typed handler - computes next state based on input
const handleTyped = (value: string) => (ev: any) => {
  const { selectedTags } = ev.from.data;
  if (!value.trim()) return activeStates.Empty(selectedTags);

  const suggestions = getSuggestions(value, selectedTags);
  return suggestions.length > 0
    ? activeStates.Suggesting(value, selectedTags, suggestions, 0)
    : activeStates.TextEntry(value, selectedTags);
};

// Shared addTag handler
const handleAddTag = (tag: string) => (ev: any) => {
  const { input, selectedTags, suggestions = [], highlightedIndex = 0 } = ev.from.data;
  const tagToAdd = tag || (suggestions.length > 0 ? suggestions[highlightedIndex] : input?.trim());
  if (!tagToAdd) {
    return activeStates.Empty();
  }
  return activeStates.Empty();
};

function createActiveForApp() {
  return matchina(activeStates, {
    Empty: {
      typed: handleTyped,
      removeTag: (tag) => (ev) => 
        activeStates.Empty(),
      backspace: () => (ev) => {
        // selectedTags is in store, not machine state
        return ev.from;
      },
    },
    TextEntry: {
      typed: handleTyped,
      clear: () => (ev) => activeStates.Empty(),
      addTag: handleAddTag,
      backspace: () => (ev) => {
        // selectedTags is in store, not machine state
        return ev.from;
      },
    },
    Suggesting: {
      typed: handleTyped,
      clear: () => (ev) => activeStates.Empty(),
      highlightNext: () => (ev) => {
        const { input, suggestions, highlightedIndex } = ev.from.data;
        const next = Math.min(suggestions.length - 1, highlightedIndex + 1);
        return activeStates.Suggesting(input, suggestions, next);
      },
      highlightPrev: () => (ev) => {
        const { input, suggestions, highlightedIndex } = ev.from.data;
        const prev = Math.max(0, highlightedIndex - 1);
        return activeStates.Suggesting(input, suggestions, prev);
      },
      selectHighlighted: () => (ev) => {
        const { input, suggestions, highlightedIndex } = ev.from.data;
        // selectedTags is in store, not machine state
        return activeStates.Empty();
      },
      cancel: () => (ev) => {
        const { input } = ev.from.data;
        return activeStates.TextEntry(input);
      },
      addTag: handleAddTag,
      backspace: () => (ev) => {
        // selectedTags is in store, not machine state
        return ev.from;
      },
    },
  });
}

export type ActiveMachine = ReturnType<typeof createActiveForApp>;

// Use submachine exactly like checkout does
const activeMachineFactory = submachine(createActiveForApp, { id: "active" });

export const appStates = defineStates({
  Inactive: () => ({}), // No selectedTags in machine state - it's in store
  Active: activeMachineFactory,
});

export function createComboboxMachine() {
  const combobox = matchina(appStates, {
    Inactive: {
      focus: "Active"
    },
    Active: {
      blur: () => (ev) => {
        const activeMachine = ev.from.data.machine;
        const activeState = activeMachine?.getState();
        const selectedTags = activeState?.data?.selectedTags ?? [];
        return appStates.Inactive(selectedTags);
      },
      close: () => (ev: any) => {
        const activeMachine = ev.from.data.machine;
        const activeState = activeMachine?.getState();
        const selectedTags = activeState?.data?.selectedTags ?? [];
        return appStates.Inactive(selectedTags);
      },
      removeTag: (tag: string) => (ev: any) => {
        // Delegate to child machine
        const activeMachine = ev.from.data.machine;
        activeMachine?.removeTag?.(tag);
        return ev.from;
      },
    },
  }, appStates.Inactive([]));

  const hierarchical = makeHierarchical(combobox);

  return hierarchical;
}
