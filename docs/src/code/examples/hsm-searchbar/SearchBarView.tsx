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
  // Always subscribe with a noop fallback to satisfy React hook rules
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
  const query: string = activeMachine?.getState().data.query ?? "";
  const subKey: string | undefined = child?.key;
  const api = machine.api;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (activeMachine) (activeMachine as any).send("typed", v);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (activeMachine as any)?.send("submit");
    }
    if (e.key === "Escape") {
      api.close();
    }
  };

  return (
    <div className="p-4 space-y-3 border rounded">
      <h3 className="font-semibold">Search Bar</h3>
      <div className="text-sm text-gray-600">
        State: <b>{state.key}</b>{active && subKey ? ` / ${subKey}` : ""}
      </div>
      <ActionButtons machine={machine} />
      {state.match({
        Active: (s: any) => s.machine && <ActionButtons machine={s.machine} />,
      }, false)}
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Type to search..."
          value={query}
          onFocus={() => api.focus()}
          onBlur={() => api.blur()}
          readOnly={!active}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <button className="btn" onClick={() => api.close()}>Close</button>
        <button className="btn" onClick={() => activeMachine?.send('clear')}>Clear</button>
      </div>
      {state.key === "Active" && <div>
        active: {state.data.machine.getState().key}
        {state.data.machine.getState().match({
          Results: ({ machine }) => (<div>
            Results: {machine.getState().key}
            {machine.getState().match({
              Pending: () => <div>Loading…</div>,
              Resolved: (s: any) => <div>Resolved: {JSON.stringify(s)}</div>,
              Rejected: (s: any) => <div>Rejected: {JSON.stringify(s)}</div>,
            }, false)}
          </div>),
      }, false)}
      </div>}
    </div>
  );
}
