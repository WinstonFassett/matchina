import { useRef } from "react";
import { useMachine } from "matchina/react";
import type { FlatComboboxMachine } from "./machine-flat";

interface ComboboxViewFlatProps {
  machine: FlatComboboxMachine;
}

export function ComboboxViewFlat({ machine }: ComboboxViewFlatProps) {
  useMachine(machine);
  useMachine(machine.model);
  const { model } = machine;
  const { input, selectedTags, suggestions, highlightedIndex } = model.getState();
  const inputRef = useRef<HTMLInputElement>(null);

  const state = machine.getState();
  const isActive = state.key !== 'Inactive';
  const isSuggesting = state.is('Active.Suggesting');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isActive) return;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        machine.blur();
        break;
      case "Backspace":
        if (!input && selectedTags.length > 0) {
          e.preventDefault();
          machine.removeTag(selectedTags.at(-1)!);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (isSuggesting) machine.highlight('next');
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isSuggesting) machine.highlight('prev');
        break;
      case "Enter":
        e.preventDefault();
        if (isSuggesting && suggestions.length > 0) {
          machine.select();
        } else if (input.trim()) {
          machine.addTag(input.trim());
        }
        break;
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        State: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          {state.key}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        {selectedTags.map((tag: string) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500 dark:bg-blue-600 text-white text-sm font-medium">
            {tag}
            <button
              onClick={() => machine.removeTag(tag)}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              ×
            </button>
          </span>
        ))}

        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              machine.model.api.setInput(e.target.value);
              machine.type();
            }}
            onFocus={() => machine.focus()}
            onBlur={() => machine.blur()}
            onKeyDown={handleKeyDown}
            placeholder="Type to add tags..."
            className="w-full px-1 py-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />

          {isSuggesting && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto z-20">
              {suggestions.map((suggestion: string, index: number) => (
                <button
                  key={suggestion}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    machine.setHighlighted(index);
                    machine.select();
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
          )}
        </div>
      </div>
    </div>
  );
}
