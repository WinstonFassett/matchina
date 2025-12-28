import React, { useEffect, useRef, useState, useContext } from "react";
import { eventApi } from "matchina";
import { useMachine } from "matchina/react";
import { parseFlatStateKey } from "matchina/nesting";
import { createFlatComboboxMachine } from "./machine-flat";

const ComboboxContext = React.createContext<{
  machine: any;
  actions: any;
}>({ machine: null, actions: null });


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
    actions.focus?.();
    // Also focus the input after activation
    setTimeout(() => inputRef.current?.focus(), 0);
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
          actions.highlightNext?.(input, selectedTags, suggestions, highlightedIndex);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (parsed.child === 'Suggesting') {
          actions.highlightPrev?.(input, selectedTags, suggestions, highlightedIndex);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (parsed.child === 'Suggesting' && suggestions.length > 0) {
          actions.selectHighlighted?.(suggestions, highlightedIndex, selectedTags);
        } else if (input.trim()) {
          actions.addTag?.(input.trim(), selectedTags);
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
        <div className="flex flex-wrap items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
          {/* Selected tags */}
          {(currentData.selectedTags || []).map((tag: string) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500 dark:bg-blue-600 text-white text-sm font-medium">
              {tag}
              <button
                onClick={() => handleTagRemove(tag)}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}

          {/* Input with suggestions */}
          <div className="relative flex-1 min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Type to add tags..."
              className="w-full px-1 py-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />

            {/* Suggestions dropdown */}
            {parsed.child === "Suggesting" && currentData.suggestions?.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto z-20">
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
