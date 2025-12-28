import { defineStates, matchina } from "matchina";
import { submachine, createHierarchicalPropagation } from "matchina/hsm";

// Available options for autocomplete
const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];


// Active child states for the tag editor
export const activeStates = defineStates({
  Empty: (selectedTags: string[] = []) => ({
    input: "",
    selectedTags
  }),
  TextEntry: (input: string, selectedTags: string[]) => ({
    input,
    selectedTags
  }),
  Suggesting: (input: string, selectedTags: string[], suggestions: string[], highlightedIndex: number = 0) => ({
    input,
    selectedTags,
    suggestions,
    highlightedIndex
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
const handleAddTag = (tag?: string) => (ev: any) => {
  const { input, selectedTags, suggestions = [], highlightedIndex = 0 } = ev.from.data;
  const tagToAdd = tag || (suggestions.length > 0 ? suggestions[highlightedIndex] : input?.trim());
  if (!tagToAdd || selectedTags.includes(tagToAdd)) {
    return activeStates.Empty(selectedTags);
  }
  return activeStates.Empty([...selectedTags, tagToAdd]);
};

function createActiveForApp(data?: { selectedTags?: string[] }) {
  const tags = data?.selectedTags ?? [];

  return matchina(activeStates, {
    Empty: {
      typed: handleTyped,
      removeTag: (tag: string) => (ev) => 
        activeStates.Empty(ev.from.data.selectedTags.filter((t: string) => t !== tag)),
      backspace: () => (ev) => {
        const selectedTags = ev.from.data.selectedTags;
        if (selectedTags.length > 0) {
          return activeStates.Empty(selectedTags.slice(0, -1));
        }
        return ev.from;
      },
    },
    TextEntry: {
      typed: handleTyped,
      clear: () => (ev) => activeStates.Empty(ev.from.data.selectedTags),
      addTag: handleAddTag,
      backspace: () => (ev) => {
        const { input, selectedTags } = ev.from.data;
        if (input.length === 0 && selectedTags.length > 0) {
          return activeStates.Empty(selectedTags.slice(0, -1));
        }
        return ev.from;
      },
    },
    Suggesting: {
      typed: handleTyped,
      clear: () => (ev) => activeStates.Empty(ev.from.data.selectedTags),
      highlightNext: () => (ev) => {
        const { input, selectedTags, suggestions, highlightedIndex } = ev.from.data;
        const next = Math.min(suggestions.length - 1, highlightedIndex + 1);
        return activeStates.Suggesting(input, selectedTags, suggestions, next);
      },
      highlightPrev: () => (ev) => {
        const { input, selectedTags, suggestions, highlightedIndex } = ev.from.data;
        const prev = Math.max(0, highlightedIndex - 1);
        return activeStates.Suggesting(input, selectedTags, suggestions, prev);
      },
      selectHighlighted: handleAddTag,
      addTag: handleAddTag,
      backspace: () => (ev) => {
        const { input, selectedTags } = ev.from.data;
        if (input.length === 0 && selectedTags.length > 0) {
          return activeStates.Empty(selectedTags.slice(0, -1));
        }
        return ev.from;
      },
    },
  }, activeStates.Empty(tags));
}

export type ActiveMachine = ReturnType<typeof createActiveForApp>;

// Use submachine exactly like checkout does
const activeMachineFactory = submachine(createActiveForApp, { id: "active" });

export const appStates = defineStates({
  Inactive: (selectedTags: string[] = []) => ({ selectedTags }),
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
      close: () => (ev) => {
        const activeMachine = ev.from.data.machine;
        const activeState = activeMachine?.getState();
        const selectedTags = activeState?.data?.selectedTags ?? [];
        return appStates.Inactive(selectedTags);
      },
      removeTag: (tag: string) => (ev) => {
        // Delegate to child machine
        const activeMachine = ev.from.data.machine;
        activeMachine?.removeTag?.(tag);
        return ev.from;
      },
    },
  }, appStates.Inactive([]));

  const hierarchical = createHierarchicalPropagation(combobox);

  return hierarchical;
}
