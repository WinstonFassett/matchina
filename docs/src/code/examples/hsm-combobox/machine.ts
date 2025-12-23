import { defineStates, matchina } from "matchina";
import { defineMachine } from "../../../../../src/definitions";
import { submachine } from "../../../../../src/nesting/submachine";
import { createHierarchicalMachine } from "../../../../../src/nesting/propagateSubmachines";

// Available options for autocomplete
const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
  "go", "java", "kotlin", "swift", "dart"
];

interface SelectingState {
  input: string;
  suggestions: string[];
  highlightedIndex: number;
  selectedTags: string[];
}

interface TagEditorState {
  input: string;
  selectedTags: string[];
  suggestions?: string[];
  highlightedIndex?: number;
}

// Active child states for the tag editor
export const activeStates = defineStates({
  Empty: (selectedTags: string[] = []) => ({
    input: "",
    selectedTags
  }),
  TextEntry: ({ input = "", selectedTags = [] }: Partial<TagEditorState>) => ({
    input,
    selectedTags
  }),
  Suggesting: ({ input = "", selectedTags = [], suggestions = [] }: Partial<TagEditorState>) => ({
    input,
    selectedTags,
    suggestions
  }),
  Selecting: ({
    input = "",
    selectedTags = [],
    suggestions = [],
    highlightedIndex = 0
  }: Partial<SelectingState>) => ({
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

// Define active machine schema for visualization
const activeDef = defineMachine(activeStates, {
  Empty: {
    typed: "TextEntry",
  },
  TextEntry: {
    typed: "TextEntry",
    clear: "Empty",
    suggest: "Suggesting",
    addTag: "Empty",
  },
  Suggesting: {
    typed: "TextEntry",
    clear: "Empty",
    navigate: "Selecting",
    addTag: "Empty",
  },
  Selecting: {
    typed: "TextEntry",
    clear: "Empty",
    highlight: "Selecting",
    addTag: "Empty",
    cancel: "TextEntry",
  },
}, "Empty");

function createActiveMachine({ onTagsChange }: { onTagsChange?: (tags: string[]) => void }) {
  const active = matchina(activeStates, {
    Empty: {
      typed: (value: string) => (ev) => {
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
    },
    TextEntry: {
      typed: (value: string) => (ev) => {
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
      clear: () => (ev) => activeStates.Empty(ev.from.data.selectedTags),
      addTag: (tag?: string) => (ev) => {
        const input = ev.from.data.input.trim();
        const tagToAdd = tag || input;
        if (!tagToAdd) return ev.from;

        const selectedTags = ev.from.data.selectedTags;
        if (selectedTags.includes(tagToAdd)) {
          return activeStates.Empty(selectedTags);
        }

        const newTags = [...selectedTags, tagToAdd];
        onTagsChange?.(newTags);
        return activeStates.Empty(newTags);
      },
    },
    Suggesting: {
      typed: (value: string) => (ev) => {
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
      clear: () => (ev) => activeStates.Empty(ev.from.data.selectedTags),
      navigate: () => (ev) => {
        return activeStates.Selecting({
          ...ev.from.data,
          highlightedIndex: 0
        });
      },
      addTag: (tag?: string) => (ev) => {
        const input = ev.from.data.input.trim();
        const tagToAdd = tag || input;
        if (!tagToAdd) return ev.from;

        const selectedTags = ev.from.data.selectedTags;
        if (selectedTags.includes(tagToAdd)) {
          return activeStates.Empty(selectedTags);
        }

        const newTags = [...selectedTags, tagToAdd];
        onTagsChange?.(newTags);
        return activeStates.Empty(newTags);
      },
    },
    Selecting: {
      typed: (value: string) => (ev) => {
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
      clear: () => (ev) => activeStates.Empty(ev.from.data.selectedTags),
      highlight: (direction: "up" | "down") => (ev) => {
        const { suggestions = [], highlightedIndex = 0 } = ev.from.data;
        const maxIndex = suggestions.length - 1;
        let newIndex = highlightedIndex;

        if (direction === "down") {
          newIndex = Math.min(maxIndex, highlightedIndex + 1);
        } else {
          newIndex = Math.max(0, highlightedIndex - 1);
        }

        return activeStates.Selecting({
          ...ev.from.data,
          highlightedIndex: newIndex
        });
      },
      addTag: (tag?: string) => (ev) => {
        const { suggestions = [], highlightedIndex = 0, selectedTags } = ev.from.data;
        const tagToAdd = tag || suggestions[highlightedIndex];
        if (!tagToAdd) return ev.from;

        if (selectedTags.includes(tagToAdd)) {
          return activeStates.Empty(selectedTags);
        }

        const newTags = [...selectedTags, tagToAdd];
        onTagsChange?.(newTags);
        return activeStates.Empty(newTags);
      },
      cancel: () => (ev) => activeStates.TextEntry({
        input: ev.from.data.input,
        selectedTags: ev.from.data.selectedTags
      }),
    },
  }, activeStates.Empty([]));

  return active;
}

// Attach .def for visualization
createActiveMachine.def = activeDef;

export type ActiveMachine = ReturnType<typeof createActiveMachine>;

// Create wrapper for app
function createActiveForApp(data?: { selectedTags?: string[] }) {
  const tags = data?.selectedTags ?? [];
  const initialState = activeStates.Empty(tags);

  const active = matchina(activeStates, {
    Empty: {
      typed: (value: string) => (ev) => {
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
    },
    TextEntry: {
      typed: (value: string) => (ev) => {
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
      clear: () => (ev) => activeStates.Empty(ev.from.data.selectedTags),
      addTag: (tag?: string) => (ev) => {
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
      typed: (value: string) => (ev) => {
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
      clear: () => (ev) => activeStates.Empty(ev.from.data.selectedTags),
      navigate: () => (ev) => {
        return activeStates.Selecting({
          ...ev.from.data,
          highlightedIndex: 0
        });
      },
      addTag: (tag?: string) => (ev) => {
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
      typed: (value: string) => (ev) => {
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
      clear: () => (ev) => activeStates.Empty(ev.from.data.selectedTags),
      highlight: (direction: "up" | "down") => (ev) => {
        const { suggestions = [], highlightedIndex = 0 } = ev.from.data;
        const maxIndex = suggestions.length - 1;
        let newIndex = highlightedIndex;

        if (direction === "down") {
          newIndex = Math.min(maxIndex, highlightedIndex + 1);
        } else {
          newIndex = Math.max(0, highlightedIndex - 1);
        }

        return activeStates.Selecting({
          ...ev.from.data,
          highlightedIndex: newIndex
        });
      },
      addTag: (tag?: string) => (ev) => {
        const { suggestions = [], highlightedIndex = 0, selectedTags } = ev.from.data;
        const tagToAdd = tag || suggestions[highlightedIndex];
        if (!tagToAdd) return ev.from;

        if (selectedTags.includes(tagToAdd)) {
          return activeStates.Empty(selectedTags);
        }

        const newTags = [...selectedTags, tagToAdd];
        return activeStates.Empty(newTags);
      },
      cancel: () => (ev) => activeStates.TextEntry({
        input: ev.from.data.input,
        selectedTags: ev.from.data.selectedTags
      }),
    },
  }, initialState);

  return active;
}
createActiveForApp.def = activeDef;

// Wrap active machine with submachine for visualization (may be used for future visualization)
// const activeMachineFactory = submachine(createActiveForApp, { id: "active" });

export const appStates = defineStates({
  Inactive: (selectedTags: string[] = []) => ({ selectedTags }),
  Active: (data?: { selectedTags?: string[] }) => ({
    machine: createActiveForApp(data)
  }),
});

export function createComboboxMachine() {
  let combobox: any;
  let hierarchical: any;

  combobox = matchina(appStates, {
    Inactive: {
      focus: (selectedTags?: string[]) => (ev) => {
        const tags = selectedTags ?? ev.from.data.selectedTags ?? [];
        return appStates.Active({ selectedTags: tags });
      }
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
        const activeMachine = ev.from.data.machine;
        const activeState = activeMachine?.getState();
        const currentTags = activeState?.data?.selectedTags ?? [];
        const newTags = currentTags.filter((t: string) => t !== tag);

        // Recreate Active state with updated tags
        return appStates.Active({ selectedTags: newTags });
      },
    },
  }, appStates.Inactive([]));

  hierarchical = createHierarchicalMachine(combobox);

  return hierarchical;
}
