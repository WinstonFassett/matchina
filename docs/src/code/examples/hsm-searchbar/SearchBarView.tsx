import React from "react";
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

export function Statuses({ machine }: { machine: FactoryMachine<any> }) {
  return getStates(machine)
    .map((state) => state.key)
    .join(" / ")
}

export function SearchBarView({ machine }: { machine: Machine }) {
  useMachine(machine);
  const state = machine.getState();

  return (
    <div className="p-4 space-y-3 border rounded">
      <h3 className="font-semibold">Search Bar</h3>
      <div className="text-sm text-gray-600">
        <Statuses machine={machine} />
      </div>
      {/* <div><ActionButtons machine={machine} /></div> */}
      {state.match({
        Active: ({machine}) => <ActiveView machine={machine} />,
        Inactive: () => <a href="#" onClick={() => machine.focus()}>Click to search</a>,
      }, false)}
    </div>
  );
}

function ActiveView({ machine }: { machine: ActiveMachine }) {
  useMachine(machine);  
  const state = machine.getState();
  const fetcherMachine = state.is("Query") ? state.data.machine : undefined;
  useMachineMaybe(fetcherMachine);
  
  const query = state.data.query;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log('submit', query)
      machine.submit();
    }
    if (e.key === "Escape") {
      // machine.close();
    }
  };
  return <div>
    <div className="flex items-center gap-2">
      <input
        className="border rounded px-2 py-1 flex-1"
        placeholder="Type to search..."
        value={query}
        // onFocus={() => machine.focus()}
        // onBlur={() => machine.blur()}
        // readOnly={!active}
        onChange={e => machine.typed(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button className="btn" onClick={() => machine.clear()}>Clear</button>
    </div>

    {state.match({
      Query: ({ machine }) => (<div>
        Results status: {machine.getState().key}
        {machine.getState().match({
          Pending: () => <div>Loading…</div>,
          Resolved: ({ items }) => <div>
            {items.map(item => <ResultItem key={item.id} {...item} />)}
          </div>,
          Rejected: (error) => <div>Rejected: {JSON.stringify(error)}</div>,
        }, false)}
      </div>),
      Selecting: ({ items, highlightedIndex}) => {
        const validIndex = Math.max(0, Math.min(items.length - 1, highlightedIndex));
        return <div>
          Selecting: {JSON.stringify({ items, highlightedIndex})}
          {items.map((item, index) => <ResultItem key={item.id} {...item} isHighlighted={index === validIndex} />)}
        </div>
      }
    }, false)}

  </div>;
}

function ResultItem({ id, title, isHighlighted }: { id: string; title: string, isHighlighted?: boolean }) {
  return <div key={id} className={isHighlighted ? "bg-blue-100 dark:bg-blue-900" : ""}>{title}</div>;
}