import { defineStates, matchina, setup, effect } from "matchina";
import { submachine, makeHierarchical } from "matchina/hsm";
import { createComboboxStore } from "./store";

const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

// Active child states for the tag editor
export const activeStates = defineStates({
  Empty: undefined,
  Typing: undefined,
  TextEntry: undefined,
  Suggesting: undefined,
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

function createActiveForApp() {
  return matchina(activeStates, {
    Empty: {
      typed: 'Typing',
      clear: 'Empty',
      cancel: 'TextEntry',
      highlightNext: 'Empty',
      highlightPrev: 'Empty',
      selectHighlighted: 'Empty',
      deactivate: () => (ev) => ev.from, // Go to parent Inactive
    },
    Typing: {
      toEmpty: 'Empty',
      toSuggesting: 'Suggesting',
      toTextEntry: 'TextEntry',
      clear: 'Empty',
      cancel: 'TextEntry',
      highlightNext: 'Typing',
      highlightPrev: 'Typing',
      selectHighlighted: 'Empty',
      deactivate: () => (ev) => ev.from, // Go to parent Inactive
    },
    TextEntry: {
      typed: 'Typing',
      clear: 'Empty',
      cancel: 'TextEntry',
      highlightNext: 'TextEntry',
      highlightPrev: 'TextEntry',
      selectHighlighted: 'Empty',
      deactivate: () => (ev) => ev.from, // Go to parent Inactive
    },
    Suggesting: {
      typed: 'Typing',
      clear: 'Empty',
      cancel: 'TextEntry',
      highlightNext: 'Suggesting',
      highlightPrev: 'Suggesting',
      selectHighlighted: 'Empty',
      deactivate: () => (ev) => ev.from, // Go to parent Inactive
    },
  }, "Empty");
}

export type ActiveMachine = ReturnType<typeof createActiveForApp>;

const activeMachineFactory = submachine(createActiveForApp, { id: "active" });

export const appStates = defineStates({
  Inactive: undefined,
  Active: activeMachineFactory,
});

// Hook specific to hierarchical machine structure
function createHierarchicalComboboxHook(store: any) {
  return effect((ev: any) => {
    if (ev && ev.type) {
      switch (ev.type) {
        case 'typed':
          if (ev.params && ev.params[0] !== undefined) {
            store.dispatch('typed', ev.params[0]);
            
            // Auto-transition to correct state based on suggestions
            setTimeout(() => {
              const state = store.getState();
              const currentState = ev.machine?.getState();
              
              if (currentState?.is("Active") && currentState.data?.machine) {
                const activeMachine = currentState.data.machine;
                const activeState = activeMachine.getState();
                
                if (state.suggestions.length > 0 && activeState?.is("Typing")) {
                  // Transition to Suggesting
                  activeMachine.send("toSuggesting");
                } else if (state.input.trim() && activeState?.is("Typing")) {
                  // Transition to TextEntry
                  activeMachine.send("toTextEntry");
                } else if (!state.input.trim() && activeState?.is("Typing")) {
                  // Transition to Empty
                  activeMachine.send("toEmpty");
                }
              }
            }, 0);
          }
          break;
        case 'clear':
          store.dispatch('clear');
          // Delegate to submachine
          const currentState = ev.machine?.getState();
          if (currentState?.is("Active") && currentState.data?.machine) {
            currentState.data.machine.send("clear");
          }
          break;
        case 'cancel':
          // Delegate to submachine
          const cancelState = ev.machine?.getState();
          if (cancelState?.is("Active") && cancelState.data?.machine) {
            cancelState.data.machine.send("cancel");
          }
          break;
        case 'highlight':
          if (ev.params && ev.params[0] !== undefined) {
            const direction = ev.params[0];
            if (direction === 'next') {
              store.dispatch('highlightNext');
              // Delegate to submachine
              const highlightState = ev.machine?.getState();
              if (highlightState?.is("Active") && highlightState.data?.machine) {
                highlightState.data.machine.send("highlightNext");
              }
            } else if (direction === 'prev') {
              store.dispatch('highlightPrev');
              // Delegate to submachine
              const highlightPrevState = ev.machine?.getState();
              if (highlightPrevState?.is("Active") && highlightPrevState.data?.machine) {
                highlightPrevState.data.machine.send("highlightPrev");
              }
            }
          }
          break;
        case 'selectHighlighted':
          store.dispatch('selectHighlighted');
          // Delegate to submachine
          const selectState = ev.machine?.getState();
          if (selectState?.is("Active") && selectState.data?.machine) {
            selectState.data.machine.send("selectHighlighted");
          }
          break;
      }
    }
  });
}

export function createComboboxMachine() {
  const store = createComboboxStore();

  const combobox = matchina(appStates, {
    Inactive: {
      focus: "Active"
    },
    Active: {
      typed: "Active", // Stay in Active, delegate to submachine
      clear: "Active", // Stay in Active, delegate to submachine
      cancel: "Active", // Stay in Active, delegate to submachine
      highlightNext: "Active", // Stay in Active, delegate to submachine
      highlightPrev: "Active", // Stay in Active, delegate to submachine
      selectHighlighted: "Active", // Stay in Active, delegate to submachine
      deactivate: "Inactive",
    },
  }, appStates.Inactive());

  const hierarchical = makeHierarchical(combobox);

  setup(hierarchical)(
    createHierarchicalComboboxHook(store)
  );

  // Expose store APIs on machine for direct access
  const machineWithStore = Object.assign(hierarchical, { 
    store,
    // Store APIs
    addTag: store.dispatch.bind(null, 'addTag'),
    removeTag: store.dispatch.bind(null, 'removeTag'),
    highlight: (direction: 'next' | 'prev') => store.dispatch('highlight', direction),
    selectHighlighted: () => store.dispatch('selectHighlighted'),
    clear: () => store.dispatch('clear'),
    deactivate: () => store.dispatch('deactivate')
  });

  return machineWithStore;
}
