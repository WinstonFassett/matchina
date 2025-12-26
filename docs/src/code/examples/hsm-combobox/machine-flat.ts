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

// Define the flattened states directly
const flatStates = defineStates({
  Inactive: undefined,
  "Active.Empty": () => ({ input: "", selectedTags: [] }),
  "Active.TextEntry": ({ input, selectedTags }: { input: string; selectedTags: string[] }) => ({ input, selectedTags }),
  "Active.Suggesting": ({ input, selectedTags, suggestions }: { input: string; selectedTags: string[]; suggestions: string[] }) => ({ input, selectedTags, suggestions }),
  "Active.Selecting": ({ input, selectedTags, suggestions, highlightedIndex }: { 
    input: string; 
    selectedTags: string[]; 
    suggestions: string[]; 
    highlightedIndex: number 
  }) => ({ input, selectedTags, suggestions, highlightedIndex }),
});

// Define the flattened transitions directly
const flatTransitions = {
  Inactive: {
    focus: () => flatStates["Active.Empty"]()
  },
  "Active.Empty": {
    typed: (input: string) => {
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? flatStates["Active.Suggesting"]({ input, selectedTags: [], suggestions })
        : flatStates["Active.TextEntry"]({ input, selectedTags: [] });
    },
    blur: () => flatStates["Inactive"](),
    close: () => flatStates["Inactive"]()
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
    blur: () => flatStates["Inactive"](),
    escape: () => flatStates["Inactive"](),
    close: () => flatStates["Inactive"]()
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
    blur: () => flatStates["Inactive"](),
    escape: () => flatStates["Inactive"](),
    close: () => flatStates["Inactive"](),
    arrowDown: () => (ev: any) => flatStates["Active.Selecting"]({ 
      input: ev.from.input, 
      selectedTags: ev.from.selectedTags, 
      suggestions: ev.from.suggestions, 
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
    blur: () => flatStates["Inactive"](),
    escape: () => flatStates["Inactive"](),
    close: () => flatStates["Inactive"](),
    arrowUp: () => (ev: any) => flatStates["Active.Selecting"]({ 
      input: ev.from.input, 
      selectedTags: ev.from.selectedTags, 
      suggestions: ev.from.suggestions, 
      highlightedIndex: Math.max(0, (ev.from.highlightedIndex || 0) - 1) 
    }),
    arrowDown: () => (ev: any) => flatStates["Active.Selecting"]({ 
      input: ev.from.input, 
      selectedTags: ev.from.selectedTags, 
      suggestions: ev.from.suggestions, 
      highlightedIndex: Math.min((ev.from.suggestions || []).length - 1, (ev.from.highlightedIndex || 0) + 1) 
    }),
    enter: () => (ev: any) => {
      const suggestions = ev.from.suggestions || [];
      const selectedTag = suggestions[ev.from.highlightedIndex || 0];
      if (selectedTag) {
        return flatStates["Active.TextEntry"]({ 
          input: "", 
          selectedTags: [...(ev.from.selectedTags || []), selectedTag] 
        });
      }
      return flatStates["Active.TextEntry"]({ 
        input: ev.from.input, 
        selectedTags: ev.from.selectedTags 
      });
    }
  }
};

export function createFlatComboboxMachine() {
  const machine = createMachineFromFlat({
    states: flatStates as any,
    transitions: flatTransitions as any,
    initial: "Inactive"
  });
  
  // Store original hierarchical definition for visualization
  (machine as any)._originalDef = {
    states: {
      Inactive: undefined,
      Active: {
        Empty: undefined,
        TextEntry: undefined,
        Suggesting: undefined,
        Selecting: undefined
      }
    },
    transitions: {
      Inactive: { focus: "Active" },
      Active: { 
        blur: "Inactive",
        close: "Inactive",
        Empty: { typed: "TextEntry", focus: "TextEntry", blur: "Inactive", close: "Inactive" },
        TextEntry: { typed: "TextEntry", blur: "Inactive", escape: "Inactive", close: "Inactive" },
        Suggesting: { typed: "Suggesting", blur: "Inactive", escape: "Inactive", close: "Inactive", arrowDown: "Selecting" },
        Selecting: { typed: "Suggesting", blur: "Inactive", escape: "Inactive", close: "Inactive", arrowUp: "Selecting", arrowDown: "Selecting", enter: "TextEntry" }
      }
    },
    initial: "Inactive"
  };
  
  return machine;
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
