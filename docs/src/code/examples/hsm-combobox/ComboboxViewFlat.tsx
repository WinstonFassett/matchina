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

  if (parsed.full === "Inactive") {
    return (
      <button
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
        onClick={() => machine.send('focus')}
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
        className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        placeholder="Type to search tags... (Press ESC to close)"
        value={input}
        onChange={(e) => machine.send('typed', e.target.value)}
        onBlur={() => machine.send('blur')}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            machine.send('escape');
            e.preventDefault();
          } else if (e.key === 'ArrowDown') {
            machine.send('arrowDown');
            e.preventDefault();
          } else if (e.key === 'ArrowUp') {
            machine.send('arrowUp');
            e.preventDefault();
          } else if (e.key === 'Enter') {
            machine.send('enter');
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
      <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 border-b border-gray-200 dark:border-gray-700">
        Use ↑↓ arrows to navigate, Enter to select, or click
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion}
          onClick={() => {
            // Use addTag event to directly add the clicked tag
            machine.send('addTag', suggestion);
          }}
          className={`w-full text-left px-3 py-2 transition-colors ${
            index === highlightedIndex
              ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
          }`}
        >
          {suggestion}
        </button>
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
