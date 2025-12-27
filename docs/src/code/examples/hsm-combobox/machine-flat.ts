import { defineStates, matchina, setup, enter, whenState } from "matchina";

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
  const baseMachine = matchina(states, {
    Inactive: {
      activate: () => states["Active.Empty"]([]),
    },

    "Active.Empty": {
      typed: (value: string, selectedTags: string[]) =>
        states["Active.Typing"](value, selectedTags),
      removeTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"](selectedTags.filter(t => t !== tag)),
      deactivate: (selectedTags: string[]) =>
        states.Inactive(selectedTags),
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
      cancel: (input: string, selectedTags: string[]) =>
        states["Active.TextEntry"](input, selectedTags),
      addTag: (tag: string, selectedTags: string[]) =>
        states["Active.Empty"]([...selectedTags, tag]),
      deactivate: (selectedTags: string[]) =>
        states.Inactive(selectedTags),
    },
  }, states.Inactive([]));

  // Add effect to Active.Typing state that auto-transitions
  setup(baseMachine)(
    enter(whenState("Active.Typing", (ev) => {
      const { input, selectedTags } = ev.to.data;

      // Defer transition to avoid synchronous state change during enter
      queueMicrotask(() => {
        if (!input.trim()) {
          baseMachine.send('toEmpty', selectedTags);
        } else {
          const suggestions = getSuggestions(input, selectedTags);
          if (suggestions.length > 0) {
            baseMachine.send('toSuggesting', input, selectedTags, suggestions);
          } else {
            baseMachine.send('toTextEntry', input, selectedTags);
          }
        }
      });
    }))
  );

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
