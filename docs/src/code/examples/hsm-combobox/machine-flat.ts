import { defineStates, createFlatMachine, t, setup, effect } from "matchina";

const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

// Helper function for suggestions
function getSuggestions(input: string, selectedTags: string[]): string[] {
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
      focus: t(() => (ev) => states["Active.Empty"](ev.from.data.selectedTags ?? [])),
    },

    "Active.Empty": {
      typed: (value: string, selectedTags: string[]) =>
        states["Active.Typing"](value, selectedTags),
      removeTag: t((tag: string) => (ev) => {
        const selectedTags = ev.from.data.selectedTags.filter((t: string) => t !== tag);
        return states["Active.Empty"](selectedTags);
      }),
      addTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"]([...selectedTags, tag]),
      deactivate: (selectedTags: string[]) =>
        states.Inactive(selectedTags),
    },

    "Active.Typing": {
      toEmpty: (selectedTags: string[]) =>
        states["Active.Empty"](selectedTags),
      // Direct transitions instead of auto-effects
      toSuggesting: (input: string, selectedTags: string[]) => {
        const suggestions = getSuggestions(input, selectedTags);
        return states["Active.Suggesting"](input, selectedTags, suggestions, 0);
      },
      toTextEntry: (input: string, selectedTags: string[]) =>
        states["Active.TextEntry"](input, selectedTags),
      removeTag: t((tag: string) => (ev) => {
        const selectedTags = ev.from.data.selectedTags.filter((t: string) => t !== tag);
        return states["Active.Typing"](ev.from.data.input, selectedTags);
      }),
      deactivate: (selectedTags: string[]) =>
        states.Inactive(selectedTags),
    },

    "Active.TextEntry": {
      typed: (value: string, selectedTags: string[]) =>
        states["Active.Typing"](value, selectedTags),
      clear: (selectedTags: string[]) =>
        states["Active.Empty"](selectedTags),
      removeTag: t((tag: string) => (ev) => {
        const selectedTags = ev.from.data.selectedTags.filter((t: string) => t !== tag);
        return states["Active.TextEntry"](ev.from.data.input, selectedTags);
      }),
      addTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"]([...selectedTags, tag]),
      deactivate: (selectedTags: string[]) =>
        states.Inactive(selectedTags),
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
      removeTag: t((tag: string) => (ev) => {
        const selectedTags = ev.from.data.selectedTags.filter((t: string) => t !== tag);
        return states["Active.Suggesting"](ev.from.data.input, selectedTags, ev.from.data.suggestions, ev.from.data.highlightedIndex);
      }),
      cancel: (input: string, selectedTags: string[]) =>
        states["Active.TextEntry"](input, selectedTags),
      addTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"]([...selectedTags, tag]),
      deactivate: (selectedTags: string[]) =>
        states.Inactive(selectedTags),
    },
  }, states.Inactive([]));

  // Add auto-transition effect for suggestions
  setup(baseMachine)(
    effect((ev) => {
      // Auto-transition to suggesting when typing and there are suggestions
      if (ev && ev.to && ev.to.key && ev.to.key.startsWith('Active.Typing')) {
        const data = ev.to.data as any;
        const { input, selectedTags } = data;
        const suggestions = getSuggestions(input, selectedTags);
        if (suggestions.length > 0) {
          // Trigger transition to suggesting state
          setTimeout(() => {
            baseMachine.send("toSuggesting", input, selectedTags);
          }, 0);
        } else {
          // Auto-transition to text entry when no suggestions
          setTimeout(() => {
            baseMachine.send("toTextEntry", input, selectedTags);
          }, 0);
        }
      }
    })
  );

  return baseMachine;
}
