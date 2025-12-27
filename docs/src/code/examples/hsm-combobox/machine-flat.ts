import { defineStates, matchina } from "matchina";

const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

function getSuggestions(input: string, selectedTags: string[]): string[] {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return [];
  return AVAILABLE_TAGS
    .filter(tag => tag.toLowerCase().includes(trimmed) && !selectedTags.includes(tag))
    .slice(0, 5);
}

// Flat state keys with dot notation
const states = defineStates({
  Inactive: (selectedTags: string[] = []) => ({ selectedTags }),

  "Active.Empty": (selectedTags: string[] = []) => ({
    input: "",
    selectedTags,
  }),

  "Active.Editing": (input: string, selectedTags: string[]) => ({
    input,
    selectedTags,
  }),

  "Active.Suggesting": (input: string, selectedTags: string[], suggestions: string[]) => ({
    input,
    selectedTags,
    suggestions,
  }),

  "Active.Selecting": (input: string, selectedTags: string[], suggestions: string[], highlightedIndex: number) => ({
    input,
    selectedTags,
    suggestions,
    highlightedIndex,
  }),
});

export function createFlatComboboxMachine() {
  return matchina(states, {
    Inactive: {
      activate: () => states["Active.Empty"]([]),
    },

    "Active.Empty": {
      startEditing: (value: string, selectedTags: string[]) =>
        states["Active.Editing"](value, selectedTags),
      removeTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"](selectedTags.filter(t => t !== tag)),
      deactivate: (selectedTags: string[]) =>
        states.Inactive(selectedTags),
    },

    "Active.Editing": {
      updateInput: (value: string, selectedTags: string[]) =>
        states["Active.Editing"](value, selectedTags),
      showSuggestions: (input: string, selectedTags: string[]) => {
        const suggestions = getSuggestions(input, selectedTags);
        return states["Active.Suggesting"](input, selectedTags, suggestions);
      },
      clearInput: (selectedTags: string[]) =>
        states["Active.Empty"](selectedTags),
      addTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"]([...selectedTags, tag]),
      deactivate: (selectedTags: string[]) =>
        states.Inactive(selectedTags),
    },

    "Active.Suggesting": {
      updateInput: (value: string, selectedTags: string[]) =>
        states["Active.Editing"](value, selectedTags),
      refreshSuggestions: (input: string, selectedTags: string[]) => {
        const suggestions = getSuggestions(input, selectedTags);
        return states["Active.Suggesting"](input, selectedTags, suggestions);
      },
      startNavigating: (input: string, selectedTags: string[], suggestions: string[]) =>
        states["Active.Selecting"](input, selectedTags, suggestions, 0),
      hideSuggestions: (input: string, selectedTags: string[]) =>
        states["Active.Editing"](input, selectedTags),
      addTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"]([...selectedTags, tag]),
      deactivate: (selectedTags: string[]) =>
        states.Inactive(selectedTags),
    },

    "Active.Selecting": {
      highlightNext: (input: string, selectedTags: string[], suggestions: string[], currentIndex: number) => {
        const nextIndex = Math.min(suggestions.length - 1, currentIndex + 1);
        return states["Active.Selecting"](input, selectedTags, suggestions, nextIndex);
      },
      highlightPrev: (input: string, selectedTags: string[], suggestions: string[], currentIndex: number) => {
        const prevIndex = Math.max(0, currentIndex - 1);
        return states["Active.Selecting"](input, selectedTags, suggestions, prevIndex);
      },
      selectHighlighted: (suggestions: string[], highlightedIndex: number, selectedTags: string[]) => {
        const tag = suggestions[highlightedIndex];
        return states["Active.Empty"]([...selectedTags, tag]);
      },
      cancelNavigation: (input: string, selectedTags: string[]) =>
        states["Active.Editing"](input, selectedTags),
      deactivate: (selectedTags: string[]) =>
        states.Inactive(selectedTags),
    },
  }, states.Inactive([]));
}

export function parseFlatStateKey(key: string) {
  const parts = key.split(".");
  return {
    parent: parts[0],
    child: parts[1] || null,
    full: key,
  };
}
