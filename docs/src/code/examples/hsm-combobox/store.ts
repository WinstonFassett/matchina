import { createStoreMachine } from "matchina";

// Available options for autocomplete
export const AVAILABLE_TAGS = [
  "typescript",
  "javascript",
  "react",
  "vue",
  "angular",
  "node",
  "deno",
  "bun",
  "python",
  "rust",
];

export interface ComboboxState {
  input: string;
  selectedTags: string[];
  suggestions: string[];
  highlightedIndex: number;
}

export function createComboboxStore() {
  const initialState: ComboboxState = {
    input: "",
    selectedTags: [],
    suggestions: [],
    highlightedIndex: 0,
  };
  const baseStore = createStoreMachine(
    initialState,
    {
      setInput: (input: string) => (change) => {
        const suggestions = getSuggestions(input, change.from.selectedTags);
        return {
          ...change.from,
          input,
          suggestions,
          highlightedIndex: 0,
        };
      },

      addTag: (tag: string) => (change) => ({
        ...change.from,
        selectedTags: [...change.from.selectedTags, tag],
        input: "",
        suggestions: [],
        highlightedIndex: 0,
      }),

      removeTag: (tag: string) => (change) => ({
        ...change.from,
        selectedTags: change.from.selectedTags.filter((t: string) => t !== tag),
      }),

      clear: () => (change) => ({
        ...change.from,
        input: "",
        suggestions: [],
        highlightedIndex: 0,
      }),

      highlight: (direction: "next" | "prev") => (change) => ({
        ...change.from,
        highlightedIndex:
          direction === "next"
            ? Math.min(
                change.from.suggestions.length - 1,
                change.from.highlightedIndex + 1
              )
            : Math.max(0, change.from.highlightedIndex - 1),
      }),

      setHighlighted: (index: number) => (change) => ({
        ...change.from,
        highlightedIndex: Math.max(
          0,
          Math.min(index, change.from.suggestions.length - 1)
        ),
      }),

      selectHighlighted: () => (change) => {
        const tag = change.from.suggestions[change.from.highlightedIndex];
        if (!tag) return change.from;

        return {
          ...change.from,
          selectedTags: [...change.from.selectedTags, tag],
          input: "",
          suggestions: [],
          highlightedIndex: 0,
        };
      },
    }
  );
  return baseStore;
  // return Object.assign(baseStore, storeApi(baseStore));
}

function getSuggestions(input: string | undefined, selectedTags: string[]): string[] {
  const trimmed = input?.trim().toLowerCase();
  if (!trimmed) return [];

  return AVAILABLE_TAGS.filter(
    (tag) => tag.toLowerCase().includes(trimmed) && !selectedTags.includes(tag)
  ).slice(0, 5);
}
