import React, { createContext, useContext, useEffect, useRef } from "react";
import { useMachine } from "matchina/react";
import { createFlatComboboxMachine, parseFlatStateKey } from "./machine-flat";

type Machine = ReturnType<typeof createFlatComboboxMachine>;

// Context for the flattened combobox machine
interface ComboboxContextValue {
  machine: Machine;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

export function useComboboxContext() {
  const context = useContext(ComboboxContext);
  if (!context) {
    throw new Error("useComboboxContext must be used within ComboboxProvider");
  }
  return context;
}

function ComboboxProvider({ machine, children }: { machine: Machine; children: React.ReactNode }) {
  useMachine(machine);
  return (
    <ComboboxContext.Provider value={{ machine }}>
      {children}
    </ComboboxContext.Provider>
  );
}

export function ComboboxViewFlat({ machine }: { machine: Machine }) {
  return (
    <ComboboxProvider machine={machine}>
      <div className="p-4 space-y-3 border rounded">
        <h3 className="font-semibold">Tag List Editor (Flattened)</h3>
        <StateDisplay />
        <SelectedTagsDisplay />
      </div>
    </ComboboxProvider>
  );
}

function StateDisplay() {
  const { machine } = useComboboxContext();
  const state = machine.getState();

  const parsed = parseFlatStateKey(state.key);

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        State: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          {parsed.full}
        </span>
      </div>
      
      <InputSection />
      <SuggestionsList />
    </div>
  );
}

function InputSection() {
  const { machine } = useComboboxContext();
  const state = machine.getState();
  const parsed = parseFlatStateKey(state.key);

  console.log('Flattened InputSection:', { 
    stateKey: state.key, 
    parsed, 
    data: state.data 
  });

  if (parsed.full === "Inactive") {
    return (
      <button
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
        onClick={() => {
          console.log('Sending focus event');
          machine.send('focus');
        }}
      >
        Click to add tags
      </button>
    );
  }

  return <ActiveInput />;
}

function ActiveInput() {
  const { machine } = useComboboxContext();
  const state = machine.getState();
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const input = state.data?.input || "";

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        placeholder="Type to search tags... (Press ESC to close)"
        value={input}
        onChange={(e) => machine.send('typed', e.target.value)}
        onBlur={() => machine.send('blur')}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            machine.send('escape');
          } else if (e.key === 'ArrowDown') {
            machine.send('arrowDown');
            e.preventDefault();
          }
        }}
      />
    </div>
  );
}

function SuggestionsList() {
  const { machine } = useComboboxContext();
  const state = machine.getState();
  const parsed = parseFlatStateKey(state.key);

  // Only show suggestions in Suggesting or Selecting states
  if (parsed.child !== "Suggesting" && parsed.child !== "Selecting") {
    return null;
  }

  const { suggestions = [], highlightedIndex = -1 } = state.data || {};

  if (suggestions.length === 0) {
    return null;
  }

  return <SuggestionsDisplay suggestions={suggestions} highlightedIndex={highlightedIndex} />;
}

function SuggestionsDisplay({
  suggestions,
  highlightedIndex,
}: {
  suggestions: string[];
  highlightedIndex: number;
}) {
  const { machine } = useComboboxContext();

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 shadow-lg">
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion}
          className={`px-3 py-2 cursor-pointer transition-colors ${
            index === highlightedIndex
              ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
          }`}
          onClick={() => {
            // For flattened machine, we need to send the enter event with the current state
            machine.send('enter');
          }}
          onMouseEnter={() => {
            if (highlightedIndex !== index) {
              // Send arrow events to navigate to the specific index
              const currentState = machine.getState();
              if (currentState.data?.suggestions) {
                // Calculate how many arrow down events needed to reach this index
                const currentIndex = currentState.data.highlightedIndex || 0;
                const diff = index - currentIndex;
                if (diff > 0) {
                  for (let i = 0; i < diff; i++) {
                    machine.send('arrowDown');
                  }
                } else if (diff < 0) {
                  for (let i = 0; i < Math.abs(diff); i++) {
                    machine.send('arrowUp');
                  }
                }
              }
            }
          }}
        >
          {suggestion}
        </div>
      ))}
    </div>
  );
}

function SelectedTagsDisplay() {
  const { machine } = useComboboxContext();
  const state = machine.getState();
  const { selectedTags = [] } = state.data || {};

  if (selectedTags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedTags.map((tag: string) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded text-sm"
        >
          {tag}
          <button
            className="ml-1 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
            onClick={() => machine.send('removeTag', tag)}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
