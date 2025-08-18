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

export function SearchBarView({ machine }: { machine: Machine }) {
  useMachine(machine);
  
  const state = machine.getState();
  let activeMachine: ActiveMachine | undefined = undefined;
  if (state.is("Active")) {
    activeMachine = state.data.machine;
  }
  useMachine(activeMachine ?? noopMachine);

  const active = state.key === "Active";
  const activeState = activeMachine?.getState();
  const fetcher: FactoryMachine<any> | undefined = activeState?.data?.machine;
  useMachine(fetcher ?? noopMachine);
  const child = active ? activeMachine?.getState?.() : null;
  const subKey: string | undefined = child?.key;


  return (
    <div className="p-4 space-y-3 border rounded">
      <h3 className="font-semibold">Search Bar</h3>
      <div className="text-sm text-gray-600">
        State: <b>{state.key}</b>{active && subKey ? ` / ${subKey}` : ""}
      </div>
      <ActionButtons machine={machine} />
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
  const query = state.data.query;
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    machine.typed(v);
  };

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
    Active View

    <div className="flex items-center gap-2">
      <input
        className="border rounded px-2 py-1 flex-1"
        placeholder="Type to search..."
        value={query}
        // onFocus={() => machine.focus()}
        // onBlur={() => machine.blur()}
        // readOnly={!active}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      {/* <button className="btn" onClick={() => machine.close()}>Close</button> */}
      <button className="btn" onClick={() => machine.clear()}>Clear</button>
    </div>


    {state.match({
      Results: ({ machine }) => (<div>
        Results: {machine.getState().key}
        {machine.getState().match({
          Pending: () => <div>Loading…</div>,
          Resolved: (items: { id: string; title: string }[]) => <div>
            {items.map((item) => <div key={item.id}>{item.title}</div>)}
          </div>,
          Rejected: (s: any) => <div>Rejected: {JSON.stringify(s)}</div>,
        }, false)}
      </div>),
    }, false)}



  </div>;
}
