import React, { useContext, useEffect, useRef, useState } from "react";
import { eventApi } from "matchina";
import { useMachine } from "matchina/react";
import { parseFlatStateKey } from "./machine-flat";

const ComboboxContext = React.createContext<{
  machine: any;
  actions: any;
}>({ machine: null, actions: null });

function useComboboxContext() {
  return useContext(ComboboxContext);
}

interface ComboboxViewFlatProps {
  machine: any;
}

export function ComboboxViewFlat({ machine }: ComboboxViewFlatProps) {
  const change = useMachine(machine) as { to: { key: string; data?: any } };
  const state = change.to;
  const parsed = parseFlatStateKey(state.key);

  const actions = eventApi(machine);

  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with machine state
  useEffect(() => {
    if (state.data?.input !== undefined) {
      setInputValue(state.data.input);
    }
  }, [state]);

  // Get current data
  const currentData = state.data || { input: "", selectedTags: [], suggestions: [], highlightedIndex: 0 };

  // Event handlers
  const handleInputChange = (value: string) => {
    setInputValue(value);
    const tags = currentData.selectedTags || [];
    actions.typed?.(value, tags);
  };

  const handleFocus = () => {
    actions.activate?.();
  };

  const handleBlur = () => {
    const tags = currentData.selectedTags || [];
    actions.deactivate?.(tags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (parsed.parent !== 'Active') return;

    const { input = '', selectedTags = [], suggestions = [], highlightedIndex = 0 } = currentData;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        actions.deactivate?.(selectedTags);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (parsed.child === 'Suggesting') {
          actions.navigate?.(input, selectedTags, suggestions);
        } else if (parsed.child === 'Selecting') {
          actions.highlightNext?.(input, selectedTags, suggestions, highlightedIndex);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (parsed.child === 'Selecting') {
          actions.highlightPrev?.(input, selectedTags, suggestions, highlightedIndex);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (parsed.child === 'Selecting') {
          actions.selectHighlighted?.(suggestions, highlightedIndex, selectedTags);
        } else if (parsed.child === 'Suggesting' || parsed.child === 'TextEntry') {
          if (input.trim()) {
            actions.addTag?.(input.trim(), selectedTags);
          }
        }
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const tags = currentData.selectedTags || [];
    actions.addTag?.(suggestion, tags);
  };

  const handleTagRemove = (tag: string) => {
    const tags = currentData.selectedTags || [];
    actions.removeTag?.(tag, tags);
  };

  return (
    <ComboboxContext.Provider value={{ machine, actions }}>
      <div className="space-y-3">
        {/* State display */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          State: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{parsed.full}</span>
        </div>

        {/* Tags input */}
        <div className="flex flex-wrap gap-2 border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-900 min-h-[100px]">
          {/* Selected tags */}
          {(currentData.selectedTags || []).map((tag: string) => (
            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 text-white text-sm">
              {tag}
              <button
                onClick={() => handleTagRemove(tag)}
                className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}

          {/* Input */}
          <div className="flex-1 min-w-[200px] relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Type to add tags..."
              className="w-full px-2 py-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
            />

            {/* Suggestions dropdown */}
            {(parsed.child === "Suggesting" || parsed.child === "Selecting") &&
             currentData.suggestions?.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto z-10">
                {currentData.suggestions.map((suggestion: string, index: number) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-3 py-2 transition-colors ${
                      index === currentData.highlightedIndex
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ComboboxContext.Provider>
  );
}
