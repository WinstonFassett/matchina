import { defineStates, createFlatMachine, t } from "matchina";

const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

// Helper function for suggestions
function _getSuggestions(input: string, selectedTags: string[]): string[] {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return [];
  return AVAILABLE_TAGS
    .filter(tag => tag.toLowerCase().includes(trimmed) && !selectedTags.includes(tag))
    .slice(0, 5);
}

// Flat state keys with dot notation representing the REAL hierarchy:
// Inactive (root)
// Active (parent)
//   ├── Active.Empty (child)
//   ├── Active.Typing (child)
//   ├── Active.TextEntry (child)
//   └── Active.Suggesting (child)
const states = defineStates({
  Inactive: (selectedTags: string[] = []) => ({ selectedTags }),

  "Active.Empty": (selectedTags: string[] = []) => ({
    input: "",
    selectedTags,
  }),

  "Active.Typing": (input: string, selectedTags: string[]) => ({
    input,
    selectedTags,
  }),

  "Active.TextEntry": (input: string, selectedTags: string[]) => ({
    input,
    selectedTags,
  }),

  "Active.Suggesting": (input: string, selectedTags: string[], suggestions: string[], highlightedIndex: number = 0) => ({
    input,
    selectedTags,
    suggestions,
    highlightedIndex,
  }),
});

export function createFlatComboboxMachine() {
  // Use createFlatMachine which maintains REAL hierarchy with parent fallback
  const baseMachine = createFlatMachine(states, {
    Inactive: {
      activate: t(
        () => (ev: any) => states["Active.Empty"](ev.from.data.selectedTags ?? []),
      ),
    },

    "Active.Empty": {
      typed: (value: string, selectedTags: string[]) =>
        states["Active.Typing"](value, selectedTags),
      removeTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"](selectedTags.filter(t => t !== tag)),
      addTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"]([...selectedTags, tag]),
    },

    "Active.Typing": {
      toEmpty: (selectedTags: string[]) =>
        states["Active.Empty"](selectedTags),
      toSuggesting: (input: string, selectedTags: string[], suggestions: string[]) =>
        states["Active.Suggesting"](input, selectedTags, suggestions, 0),
      toTextEntry: (input: string, selectedTags: string[]) =>
        states["Active.TextEntry"](input, selectedTags),
    },

    "Active.TextEntry": {
      typed: (value: string, selectedTags: string[]) =>
        states["Active.Typing"](value, selectedTags),
      clear: (selectedTags: string[]) =>
        states["Active.Empty"](selectedTags),
      addTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"]([...selectedTags, tag]),
    },

    "Active.Suggesting": {
      typed: (value: string, selectedTags: string[]) =>
        states["Active.Typing"](value, selectedTags),
      clear: (selectedTags: string[]) =>
        states["Active.Empty"](selectedTags),
      highlightNext: (input: string, selectedTags: string[], suggestions: string[], currentIndex: number) => {
        const nextIndex = Math.min(suggestions.length - 1, currentIndex + 1);
        return states["Active.Suggesting"](input, selectedTags, suggestions, nextIndex);
      },
      highlightPrev: (input: string, selectedTags: string[], suggestions: string[], currentIndex: number) => {
        const prevIndex = Math.max(0, currentIndex - 1);
        return states["Active.Suggesting"](input, selectedTags, suggestions, prevIndex);
      },
      selectHighlighted: (suggestions: string[], highlightedIndex: number, selectedTags: string[]) => {
        const tag = suggestions[highlightedIndex];
        return states["Active.Empty"]([...selectedTags, tag]);
      },
      cancel: (input: string, selectedTags: string[]) =>
        states["Active.TextEntry"](input, selectedTags),
      addTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"]([...selectedTags, tag]),
    },
  }, states.Inactive([]));

  // Note: Auto-transition effect removed due to type issues
  // In a real implementation, this would be handled differently

  return baseMachine;
}

export function parseFlatStateKey(key: string) {
  const parts = key.split(".");
  return {
    parent: parts[0],
    child: parts[1] || null,
    full: key,
  };
}
