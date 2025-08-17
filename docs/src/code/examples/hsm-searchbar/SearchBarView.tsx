import React, { useMemo } from "react";
import { useMachine } from "matchina/react";
import { getAvailableActions, type FactoryMachine } from "matchina";
import type { createSearchBarMachine } from "./machine";

type Machine = ReturnType<typeof createSearchBarMachine>;

export function ActionButtons({ machine }: { machine: FactoryMachine<any> }) {
  return getAvailableActions(machine.transitions, machine.getState().key).map((action) => (
    <button className="px-3 py-1 rounded bg-blue-500 text-white text-sm" key={action} onClick={() => machine.send(action as any)}>{action}</button>
  ))
}

const nullMachineHack = { getChange: () => null, notify: () => undefined }

export function SearchBarView({ machine }: { machine: Machine }) {
  useMachine(machine);
  
  const state = machine.getState();
  let activeMachine: FactoryMachine<any> | undefined = undefined;
  if (state.is("Active")) {
    activeMachine = state.data.machine;
  }
  console.log('activeMachine', activeMachine, activeMachine?.getState())
  useMachine(activeMachine ?? nullMachineHack as any);
  const active = state.key === "Active";
  const child = active ? activeMachine?.getState?.() : null;
  // const query: string = child?.data?.query ?? "";
  const query = activeMachine?.getState().data.query ?? "";
  const subKey: string | undefined = child?.key;
  const results: Array<{ id: string; title: string }> = child?.results ?? [];
  const error: string | undefined = child?.message;
  const api = machine.api;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (activeMachine) {
      console.log('change', v)
      activeMachine.send("typed", v)
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // api.submit();
      // machine.send("submit")
      activeMachine?.send("submit")
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
      {machine.getState().match({
        Active: (s: any) => s.machine && <ActionButtons machine={s.machine} />,
      }, false)}
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Type to search..."
          value={query}
          onFocus={() => api.focus()}
          onBlur={() => api.blur()}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <button className="btn" onClick={() => api.close()}>Close</button>
        <button className="btn" onClick={() => activeMachine?.send('clear')}>Clear</button>
        {subKey === "Error" && (
          <button className="btn" onClick={() => api.retry()}>Retry</button>
        )}
      </div>

      {subKey === "Results" && results?.length > 0 && (
        <ul className="list-disc pl-5 space-y-1">
          {results.map((r) => (
            <li key={r.id}>{r.title}</li>
          ))}
        </ul>
      )}

      {subKey === "Error" && (
        <div className="text-red-600">{error}</div>
      )}
    </div>
  );
}
