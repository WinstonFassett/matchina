import {
  defineStates,
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

// Define the flattened states directly
const flatStates = defineStates({
  Inactive: undefined,
  "Active.Empty": (selectedTags: string[] = []) => ({
    input: "",
    selectedTags
  }),
  "Active.TextEntry": ({ input = "", selectedTags = [] }: Partial<TagEditorState>) => ({
    input,
    selectedTags
  }),
  "Active.Suggesting": ({ input = "", selectedTags = [], suggestions = [] }: Partial<TagEditorState>) => ({
    input,
    selectedTags,
    suggestions
  }),
  "Active.Selecting": ({
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

// Define the flattened transitions directly
const flatTransitions = {
  Inactive: {
    focus: "Active.Empty"
  },
  "Active.Empty": {
    typed: (input: string) => flatStates["Active.TextEntry"]({ input, selectedTags: [] }),
    focus: () => flatStates["Active.TextEntry"]({ input: "", selectedTags: [] }),
    blur: "Inactive",
    close: "Inactive"
  },
  "Active.TextEntry": {
    typed: (input: string) => {
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? flatStates["Active.Suggesting"]({ input, selectedTags: [], suggestions })
        : flatStates["Active.TextEntry"]({ input, selectedTags: [] });
    },
    blur: "Inactive",
    escape: "Inactive",
    close: "Inactive"
  },
  "Active.Suggesting": {
    typed: (input: string) => {
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? flatStates["Active.Suggesting"]({ input, selectedTags: [], suggestions })
        : flatStates["Active.TextEntry"]({ input, selectedTags: [] });
    },
    blur: "Inactive",
    escape: "Inactive",
    close: "Inactive",
    arrowDown: () => flatStates["Active.Selecting"]({ 
      input: "", 
      selectedTags: [], 
      suggestions: [], 
      highlightedIndex: 0 
    })
  },
  "Active.Selecting": {
    typed: (input: string) => {
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? flatStates["Active.Suggesting"]({ input, selectedTags: [], suggestions })
        : flatStates["Active.TextEntry"]({ input, selectedTags: [] });
    },
    blur: "Inactive",
    escape: "Inactive",
    close: "Inactive",
    arrowUp: (state: any) => flatStates["Active.Selecting"]({ 
      input: state.input, 
      selectedTags: state.selectedTags, 
      suggestions: state.suggestions || [], 
      highlightedIndex: Math.max(0, state.highlightedIndex - 1) 
    }),
    arrowDown: (state: any) => flatStates["Active.Selecting"]({ 
      input: state.input, 
      selectedTags: state.selectedTags, 
      suggestions: state.suggestions || [], 
      highlightedIndex: Math.min(state.suggestions!.length - 1, state.highlightedIndex + 1) 
    }),
    enter: (state: any) => {
      const selectedTag = state.suggestions![state.highlightedIndex];
      return flatStates["Active.TextEntry"]({ 
        input: "", 
        selectedTags: [...state.selectedTags, selectedTag] 
      });
    }
  }
};

export function createFlatComboboxMachine() {
  return createMachineFromFlat({
    states: flatStates as any,
    transitions: flatTransitions as any,
    initial: "Inactive"
  });
}

// Helper to parse flat state key
export function parseFlatStateKey(key: string) {
  const parts = key.split(".");
  return {
    parent: parts[0],
    child: parts[1] || null,
    full: key,
  };
}