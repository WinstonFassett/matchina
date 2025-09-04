import React, { useEffect, useRef } from "react";
import { useMachine } from "matchina/react";
import { type FactoryMachine, getAvailableActions, createMachine } from "matchina";
import type { ActiveMachine, createSearchBarMachine } from "./machine";

type Machine = ReturnType<typeof createSearchBarMachine>;

export function ActionButtons({ machine }: { machine: FactoryMachine<any> }) {
  return getAvailableActions(machine.transitions, machine.getState().key).map((action) => (
    <button className="px-3 py-1 rounded bg-blue-500 text-white text-sm" key={action} onClick={() => machine.send(action as any)}>{action}</button>
  ))
}
const noopMachine = createMachine({}, {}, undefined as never);

function useMachineMaybe(machine: FactoryMachine<any> | undefined) {  
  return useMachine(machine ?? noopMachine);
}

export function getStates(machine: FactoryMachine<any>) {
  const state = machine.getState();
  const states = [state]
  const submachine = state.data?.machine;
  if (submachine) {
    states.push(...getStates(submachine))
  }
  return states
}

// Returns canonical hierarchical state path for a machine
export function getStatusPath(machine: FactoryMachine<any>) {
  const states = getStates(machine);
  // Only show up to Selecting/Error, not deep fetcher states
  const keys = [];
  for (const state of states) {
    keys.push(state.key);
    if (state.key === "Selecting" || state.key === "Error") break;
  }
  return keys.join(" / ");
}

export function Statuses({ machine }: { machine: FactoryMachine<any> }) {
  return getStates(machine)
    .map((state) => state.key)
    .join(" / ")
}

export function SearchBarView({ machine }: { machine: Machine }) {
  useMachine(machine);
  const statusPath = getStatusPath(machine);
  return (
    <div className="p-4 space-y-3 border rounded bg-white dark:bg-gray-800">
      <h3 className="font-semibold text-lg mb-2">Search Bar</h3>
      <div className="text-base text-gray-700 dark:text-gray-200 font-medium mb-2">
        State: <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">{statusPath}</span>
      </div>
      {machine.getState().match({
        Active: ({machine: activeMachine}: any) => <ActiveView machine={activeMachine} parentMachine={machine} />,
        Inactive: () => <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline" onClick={() => machine.focus()}>Click to search</button>,
      }, false)}
    </div>
  );
}

function ActiveView({ machine, parentMachine }: { machine: ActiveMachine, parentMachine: Machine }) {
  const activeMachine = machine as ActiveMachine;
  useMachine(activeMachine);  
  const state = activeMachine.getState();
  console.log('Active state:', state.key, state.data);
  const fetcherMachine = state.is("Query") ? state.data.machine : undefined;
  useMachineMaybe(fetcherMachine);
  
  // Log state changes for debugging
  useEffect(() => {
    console.log('State changed to:', state.key, state.data);
    if (state.is("Selecting")) {
      console.log('Items in Selecting state:', state.data.items);
    }
  }, [state.key, state.data]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Autofocus when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const query = state.data.query;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log('submit', query)
      activeMachine.submit(query ?? "");
    }
    if (e.key === "Escape") {
      parentMachine.close();
    }
  };
  return <div>
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        placeholder="Type to search... (Press ESC to cancel)"
        value={query ?? ""}
        onChange={e => activeMachine.typed(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button className="px-3 py-1 rounded bg-gray-500 text-white text-sm hover:bg-gray-600 transition-colors" onClick={() => activeMachine.clear()}>Clear</button>
    </div>

    {state.match({
      Query: ({ machine: queryMachine }: {machine: any}) => (<div>
        Results status: {queryMachine.getState().key}
        {queryMachine.getState().match({
          Pending: () => <div>Loading…</div>,
          Resolved: ({ items }: {items: any[]}) => <div>
            {items.map((item: any) => <ResultItem key={item.id} {...item} />)}
          </div>,
          Rejected: (error: any) => <div>Rejected: {JSON.stringify(error)}</div>,
        }, false)}
      </div>),
      Selecting: ({ query, items, highlightedIndex }: {query: string, items: any[], highlightedIndex: number}) => <Selecting 
        items={items} 
        highlightedIndex={highlightedIndex} 
        setHighlightedIndex={(highlightedIndex: number) => {
          console.log("Set Highlighted Index", { highlightedIndex })
          activeMachine.highlight(highlightedIndex)
        }}
        select={(index: number) => {
          console.log("Select", { index })
          activeMachine.done(query ?? "")
        }}
      />
    }, false)}

  </div>;
}

const Selecting = ({
  items,
  highlightedIndex,
  setHighlightedIndex,
  select,
}: {
  items: any[];
  highlightedIndex: number;
  setHighlightedIndex: (highlightedIndex: number) => void;
  select: (index: number) => void;
}) => {
  const validIndex = Math.max(0, Math.min(items.length - 1, highlightedIndex));
  // attach keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex(validIndex + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex(validIndex - 1);
          break;
        case "Enter":
          event.preventDefault();
          select(validIndex);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [validIndex]);
  return (
    <div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Use ↑↓ arrows to navigate, Enter to select</div>
      {items.map((item, index) => (
        <ResultItem
          key={item.id}
          {...item}
          isHighlighted={index === validIndex}
        />
      ))}
    </div>
  );
};


function ResultItem({ id, title, isHighlighted }: { id: string; title: string, isHighlighted?: boolean }) {
  return <div key={id} className={`p-2 rounded cursor-pointer transition-colors ${
    isHighlighted 
      ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700" 
      : "hover:bg-gray-100 dark:hover:bg-gray-700"
  }`}>{title}</div>;
}