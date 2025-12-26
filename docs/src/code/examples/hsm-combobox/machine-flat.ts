import {
  defineStates,
  defineMachine,
  defineSubmachine,
  flattenMachineDefinition,
  createMachineFromFlat
} from "matchina";

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
const activeStates = defineStates({
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

// Define the active combobox machine as submachine
const activeMachineDef = defineSubmachine(
  activeStates,
  {
    Empty: {
      typed: (input: string) => activeStates.TextEntry({ input, selectedTags: [] }),
      focus: activeStates.TextEntry({ input: "", selectedTags: [] })
    },
    TextEntry: {
      typed: (input: string) => {
        const suggestions = input.length > 0 
          ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
          : [];
        
        return suggestions.length > 0 
          ? activeStates.Suggesting({ input, selectedTags: [], suggestions })
          : activeStates.TextEntry({ input, selectedTags: [] });
      },
      blur: activeStates.Empty({ selectedTags: [] }),
      escape: activeStates.Empty({ selectedTags: [] })
    },
    Suggesting: {
      typed: (input: string) => {
        const suggestions = input.length > 0 
          ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
          : [];
        
        return suggestions.length > 0 
          ? activeStates.Suggesting({ input, selectedTags: [], suggestions })
          : activeStates.TextEntry({ input, selectedTags: [] });
      },
      blur: activeStates.Empty({ selectedTags: [] }),
      escape: activeStates.Empty({ selectedTags: [] }),
      arrowDown: (state: any) => activeStates.Selecting({ 
        input: state.input, 
        selectedTags: state.selectedTags, 
        suggestions: state.suggestions || [], 
        highlightedIndex: 0 
      })
    },
    Selecting: {
      typed: (input: string) => {
        const suggestions = input.length > 0 
          ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
          : [];
        
        return suggestions.length > 0 
          ? activeStates.Suggesting({ input, selectedTags: [], suggestions })
          : activeStates.TextEntry({ input, selectedTags: [] });
      },
      blur: activeStates.Empty({ selectedTags: [] }),
      escape: activeStates.Empty({ selectedTags: [] }),
      arrowUp: (state: any) => activeStates.Selecting({ 
        input: state.input, 
        selectedTags: state.selectedTags, 
        suggestions: state.suggestions || [], 
        highlightedIndex: Math.max(0, state.highlightedIndex - 1) 
      }),
      arrowDown: (state: any) => activeStates.Selecting({ 
        input: state.input, 
        selectedTags: state.selectedTags, 
        suggestions: state.suggestions || [], 
        highlightedIndex: Math.min(state.suggestions!.length - 1, state.highlightedIndex + 1) 
      }),
      enter: (state: any) => {
        const selectedTag = state.suggestions![state.highlightedIndex];
        return activeStates.TextEntry({ 
          input: "", 
          selectedTags: [...state.selectedTags, selectedTag] 
        });
      }
    }
  },
  activeStates.Empty({ selectedTags: [] })
);

// Define the combobox states with active submachine
const comboboxStates = defineStates({
  Inactive: undefined,
  Active: activeMachineDef,
});

// Define the hierarchical machine
const hierarchicalDef = defineMachine(
  comboboxStates,
  {
    Inactive: {
      focus: "Active"
    },
    Active: {
      blur: "Inactive",
      close: "Inactive"
    },
  },
  "Inactive"
);

// Flatten and create the machine
const flatDef = flattenMachineDefinition(hierarchicalDef);

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
