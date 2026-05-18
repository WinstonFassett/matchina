import { useLayoutEffect } from "react";
import { XIcon, SearchIcon, CheckIcon } from "lucide-react";

export interface ComboboxMachineApi {
  model: {
    getState(): {
      input: string;
      selectedTags: string[];
      suggestions: string[];
      highlightedIndex: number;
    };
  };
  getState(): { key: string };
  send(event: string, data?: any): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
  select(): void;
  highlight(dir: "next" | "prev"): void;
  setHighlighted(index: number): void;
  focusEffect?: (cb: (ev: { type: string }) => void) => () => void;
}

interface ComboboxViewProps {
  stateKey: string;
  isActive: boolean;
  input: string;
  selectedTags: string[];
  suggestions: string[];
  highlightedIndex: number;
  onFocus(): void;
  onBlur(): void;
  onType(value: string): void;
  onSelect(index: number): void;
  onAdd(tag: string): void;
  onRemove(tag: string): void;
  onHighlight(dir: "next" | "prev"): void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}

export function ComboboxView({
  stateKey,
  isActive,
  input,
  selectedTags,
  suggestions,
  highlightedIndex,
  onFocus,
  onBlur,
  onType,
  onSelect,
  onAdd,
  onRemove,
  onHighlight,
  searchRef,
}: ComboboxViewProps) {
  useLayoutEffect(() => {
    if (isActive) searchRef.current?.focus();
  }, [isActive]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isActive) return;
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        onBlur();
        break;
      case "Backspace":
        if (!input && selectedTags.length > 0) {
          e.preventDefault();
          onRemove(selectedTags.at(-1)!);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (suggestions.length > 0) onHighlight("next");
        break;
      case "ArrowUp":
        e.preventDefault();
        if (suggestions.length > 0) onHighlight("prev");
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions.length > 0) {
          onSelect(highlightedIndex);
        } else if (input.trim()) {
          onAdd(input.trim());
        }
        break;
    }
  };

  return (
    <div className="space-y-3 w-full px-2">
      <div className="text-sm text-muted-foreground">
        State:{" "}
        <span className="badge badge-outline font-mono">{stateKey}</span>
      </div>

      <div className="relative w-full">
        {/* Trigger */}
        <button
          type="button"
          role="combobox"
          aria-expanded={isActive}
          onClick={() => (isActive ? onBlur() : onFocus())}
          className="btn btn-outline h-auto min-h-10 w-full justify-start p-2 font-normal text-left focus:outline-none focus-visible:ring-0"
        >
          <div className="flex flex-wrap items-center gap-1.5 w-full">
            {selectedTags.map((tag) => (
              <span key={tag} className="chip chip-primary gap-1.5">
                {tag}
                <span
                  role="button"
                  aria-label={`Remove ${tag}`}
                  onClick={(e) => { e.stopPropagation(); onRemove(tag); }}
                  className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity inline-flex items-center"
                >
                  <XIcon size={10} />
                </span>
              </span>
            ))}
            {selectedTags.length === 0 && (
              <span className="px-1 text-muted-foreground text-sm">
                Select a tag...
              </span>
            )}
          </div>
        </button>

        {/* Dropdown */}
        {isActive && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="absolute top-full left-0 right-0 mt-1 border border-border bg-popover rounded-md z-20 overflow-hidden shadow-md"
          >
            {/* Search */}
            <div className="flex items-center border-b border-border px-3">
              <SearchIcon size={14} className="shrink-0 text-muted-foreground mr-2" />
              <input
                ref={searchRef}
                type="text"
                value={input}
                onChange={(e) => onType(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={handleKeyDown}
                placeholder="Search tags..."
                className="flex-1 py-2.5 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* List */}
            <div className="max-h-52 overflow-y-auto py-1">
              {suggestions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No tags found.
                </div>
              ) : (
                suggestions.map((suggestion, index) => {
                  const isSelected = selectedTags.includes(suggestion);
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <button
                      key={suggestion}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(index);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer flex items-center justify-between ${
                        isHighlighted
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <span>{suggestion}</span>
                      {isSelected && (
                        <CheckIcon size={14} className="text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
