import { createStoreMachine } from "matchina";

// Available options for autocomplete
export const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

export interface ComboboxState {
  input: string;
  selectedTags: string[];
  suggestions: string[];
  highlightedIndex: number;
  isActive: boolean;
}

export function createComboboxStore() {
  return createStoreMachine<ComboboxState>({
    input: "",
    selectedTags: [],
    suggestions: [],
    highlightedIndex: 0,
    isActive: false,
  }, {
    typed: (value: string) => (change) => ({
      ...change.from,
      input: value,
      suggestions: getSuggestions(value, change.from.selectedTags),
      highlightedIndex: 0,
    }),
    
    addTag: (tag?: string) => (change) => {
      const tagToAdd = tag || change.from.suggestions[change.from.highlightedIndex] || change.from.input.trim();
      if (!tagToAdd || change.from.selectedTags.includes(tagToAdd)) {
        return change.from;
      }
      return {
        ...change.from,
        selectedTags: [...change.from.selectedTags, tagToAdd],
        input: "",
        suggestions: [],
        highlightedIndex: 0,
      };
    },
    
    removeTag: (tag: string) => (change) => ({
      ...change.from,
      selectedTags: change.from.selectedTags.filter((t: string) => t !== tag),
    }),
    
    backspace: () => (change) => {
      if (change.from.input.length === 0 && change.from.selectedTags.length > 0) {
        return {
          ...change.from,
          selectedTags: change.from.selectedTags.slice(0, -1),
        };
      }
      return change.from;
    },
    
    clear: () => (change) => ({
      ...change.from,
      input: "",
      suggestions: [],
      highlightedIndex: 0,
    }),
    
    highlightNext: () => (change) => ({
      ...change.from,
      highlightedIndex: Math.min(change.from.suggestions.length - 1, change.from.highlightedIndex + 1),
    }),
    
    highlightPrev: () => (change) => ({
      ...change.from,
      highlightedIndex: Math.max(0, change.from.highlightedIndex - 1),
    }),
    
    activate: () => (change) => ({
      ...change.from,
      isActive: true,
    }),
    
    deactivate: () => (change) => ({
      ...change.from,
      isActive: false,
      input: "",
      suggestions: [],
      highlightedIndex: 0,
    }),
  });
}

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
