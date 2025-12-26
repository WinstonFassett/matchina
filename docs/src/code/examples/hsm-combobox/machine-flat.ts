import {
  defineStates,
  defineMachine,
  defineSubmachine,
  flattenMachineDefinition,
  createMachineFromFlat,
  t
} from "matchina";

// Available options for autocomplete
const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
  "go", "java", "kotlin", "swift", "dart"
];

// Active child states (same as hierarchical version)
const activeStates = defineStates({
  Empty: (selectedTags: string[] = []) => ({
    input: "",
    selectedTags
  }),
  TextEntry: ({ input = "", selectedTags = [] }: { input: string; selectedTags: string[] }) => ({
    input,
    selectedTags
  }),
  Suggesting: ({ input = "", selectedTags = [], suggestions = [] }: {
    input: string;
    selectedTags: string[];
    suggestions: string[]
  }) => ({
    input,
    selectedTags,
    suggestions
  }),
  Selecting: ({ input = "", selectedTags = [], suggestions = [], highlightedIndex = 0 }: {
    input: string;
    selectedTags: string[];
    suggestions: string[];
    highlightedIndex: number
  }) => ({
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

// Shared discovery function for typed transitions
const discoverTyped = (f: any) => {
  const mockEv = { from: { data: { selectedTags: [] } } };
  return [
    f("")(mockEv),        // Empty input → Empty
    f("typ")(mockEv),     // Partial match → Suggesting
    f("nomatch")(mockEv)  // No match → TextEntry
  ];
};

// Define the active submachine (nested states when focused)
const activeSubmachine = defineSubmachine(
  activeStates,
  {
    Empty: {
      typed: t(
        (value: string) => (ev: any) => {
          const selectedTags = ev.from.data.selectedTags;
          if (!value.trim()) return activeStates.Empty(selectedTags);

          const suggestions = getSuggestions(value, selectedTags);
          if (suggestions.length > 0) {
            return activeStates.Suggesting({
              input: value,
              selectedTags,
              suggestions
            });
          }
          return activeStates.TextEntry({ input: value, selectedTags });
        },
        discoverTyped
      ),
      removeTag: t(
        (tag: string) => (ev: any) => {
          const newTags = ev.from.data.selectedTags.filter((t: string) => t !== tag);
          return activeStates.Empty(newTags);
        },
        () => [activeStates.Empty([])]  // Always returns Empty
      ),
    },
    TextEntry: {
      typed: t(
        (value: string) => (ev: any) => {
          const selectedTags = ev.from.data.selectedTags;
          if (!value.trim()) {
            return activeStates.Empty(selectedTags);
          }

          const suggestions = getSuggestions(value, selectedTags);
          if (suggestions.length > 0) {
            return activeStates.Suggesting({
              input: value,
              selectedTags,
              suggestions
            });
          }
          return activeStates.TextEntry({ input: value, selectedTags });
        },
        discoverTyped
      ),
      clear: () => (ev: any) => activeStates.Empty(ev.from.data.selectedTags),
      addTag: (tag?: string) => (ev: any) => {
        const input = ev.from.data.input.trim();
        const tagToAdd = tag || input;
        if (!tagToAdd) return ev.from;

        const selectedTags = ev.from.data.selectedTags;
        if (selectedTags.includes(tagToAdd)) {
          return activeStates.Empty(selectedTags);
        }

        const newTags = [...selectedTags, tagToAdd];
        return activeStates.Empty(newTags);
      },
    },
    Suggesting: {
      typed: t(
        (value: string) => (ev: any) => {
          const selectedTags = ev.from.data.selectedTags;
          if (!value.trim()) {
            return activeStates.Empty(selectedTags);
          }

          const suggestions = getSuggestions(value, selectedTags);
          if (suggestions.length > 0) {
            return activeStates.Suggesting({
              input: value,
              selectedTags,
              suggestions
            });
          }
          return activeStates.TextEntry({ input: value, selectedTags });
        },
        discoverTyped
      ),
      clear: () => (ev: any) => activeStates.Empty(ev.from.data.selectedTags),
      arrowDown: () => (ev: any) => {
        return activeStates.Selecting({
          ...ev.from.data,
          highlightedIndex: 0
        });
      },
      addTag: (tag?: string) => (ev: any) => {
        const input = ev.from.data.input.trim();
        const tagToAdd = tag || input;
        if (!tagToAdd) return ev.from;

        const selectedTags = ev.from.data.selectedTags;
        if (selectedTags.includes(tagToAdd)) {
          return activeStates.Empty(selectedTags);
        }

        const newTags = [...selectedTags, tagToAdd];
        return activeStates.Empty(newTags);
      },
    },
    Selecting: {
      typed: t(
        (value: string) => (ev: any) => {
          const selectedTags = ev.from.data.selectedTags;
          if (!value.trim()) {
            return activeStates.Empty(selectedTags);
          }

          const suggestions = getSuggestions(value, selectedTags);
          if (suggestions.length > 0) {
            return activeStates.Suggesting({
              input: value,
              selectedTags,
              suggestions
            });
          }
          return activeStates.TextEntry({ input: value, selectedTags });
        },
        discoverTyped
      ),
      clear: () => (ev: any) => activeStates.Empty(ev.from.data.selectedTags),
      arrowUp: () => (ev: any) => {
        const { suggestions = [], highlightedIndex = 0 } = ev.from.data;
        const newIndex = Math.max(0, highlightedIndex - 1);
        return activeStates.Selecting({
          ...ev.from.data,
          highlightedIndex: newIndex
        });
      },
      arrowDown: () => (ev: any) => {
        const { suggestions = [], highlightedIndex = 0 } = ev.from.data;
        const maxIndex = suggestions.length - 1;
        const newIndex = Math.min(maxIndex, highlightedIndex + 1);
        return activeStates.Selecting({
          ...ev.from.data,
          highlightedIndex: newIndex
        });
      },
      enter: () => (ev: any) => {
        const { suggestions = [], highlightedIndex = 0, selectedTags } = ev.from.data;
        const tagToAdd = suggestions[highlightedIndex];
        if (!tagToAdd) return ev.from;

        if (selectedTags.includes(tagToAdd)) {
          return activeStates.Empty(selectedTags);
        }

        const newTags = [...selectedTags, tagToAdd];
        return activeStates.Empty(newTags);
      },
      cancel: () => (ev: any) => activeStates.TextEntry({
        input: ev.from.data.input,
        selectedTags: ev.from.data.selectedTags
      }),
    },
  },
  "Empty"
);

// Top-level states factory
const topStates = defineStates({
  Inactive: (selectedTags: string[] = []) => ({ selectedTags }),
  Active: activeSubmachine,
});

// Define the top-level combobox machine
const comboboxDef = defineMachine(
  topStates,
  {
    Inactive: {
      focus: () => activeStates.Empty([])
    },
    Active: {
      blur: () => (ev: any) => {
        const selectedTags = ev.from.data?.selectedTags ?? [];
        return topStates.Inactive(selectedTags);
      },
      escape: () => (ev: any) => {
        const selectedTags = ev.from.data?.selectedTags ?? [];
        return topStates.Inactive(selectedTags);
      },
      close: () => (ev: any) => {
        const selectedTags = ev.from.data?.selectedTags ?? [];
        return topStates.Inactive(selectedTags);
      },
    },
  },
  "Inactive"
);

// Flatten and create the machine
const flatDef = flattenMachineDefinition(comboboxDef);

export function createFlatComboboxMachine() {
  return createMachineFromFlat(flatDef);
}

// Helper to parse hierarchical state key
export function parseFlatStateKey(key: string) {
  const parts = key.split(".");
  return {
    parent: parts[0],
    child: parts[1] || null,
    full: key,
  };
}
