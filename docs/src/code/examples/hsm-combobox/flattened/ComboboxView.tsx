import { useRef, useEffect } from "react";
import { effect, setup } from "matchina";
import { useMachine } from "matchina/react";
import { ComboboxView } from "../../combobox-common/ComboboxView";
import type { FlatComboboxMachine } from "./machine";

interface ComboboxViewFlatProps {
  machine: FlatComboboxMachine;
}

export function ComboboxViewFlat({ machine }: ComboboxViewFlatProps) {
  useMachine(machine);
  useMachine(machine.model);
  const { input, selectedTags, suggestions, highlightedIndex } = machine.model.getState();
  const searchRef = useRef<HTMLInputElement>(null);

  const state = machine.getState();
  const isActive = state.key !== "Inactive";
  useEffect(() =>
    setup(machine)(
      effect((ev: any) => {
        if (ev.type === "focus") searchRef.current?.focus();
        if (ev.type === "blur") searchRef.current?.blur();
      })
    ),
    [machine]
  );

  return (
    <ComboboxView
      stateKey={state.key}
      isActive={isActive}
      input={input}
      selectedTags={selectedTags}
      suggestions={suggestions}
      highlightedIndex={highlightedIndex}
      searchRef={searchRef}
      onFocus={() => machine.send("focus")}
      onBlur={() => machine.send("blur")}
      onType={(v) => machine.send("type", v)}
      onSelect={(i) => { machine.setHighlighted(i); machine.select(); }}
      onAdd={(tag) => machine.addTag(tag)}
      onRemove={(tag) => machine.removeTag(tag)}
      onHighlight={(dir) => machine.highlight(dir)}
    />
  );
}
