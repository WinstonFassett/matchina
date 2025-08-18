import { createSearchBarMachine } from "./machine";
import { useMachine } from "matchina/react";

const searchMachine = createSearchBarMachine();
const activeMachine = searchMachine.activeMachine;

export const SearchInput = () => {
  useMachine(searchMachine);
  const state = activeMachine.getState();

  return (
    <div>
      <input
        type="text"
        role="search"
        placeholder="Search..."
        onChange={(event) =>
          // send({ type: "Query Change", query: event.target.value })
          activeMachine.typed(event.target.value)
        }
        value={
          activeMachine.getState().data.query
        }
        className={activeMachine.getState().is("Selecting") ? "open" : ""}
      />
      
      {state.matches("No Results") && state.context.query && (
        <div className="no-results" role="none">
          No Results
        </div>
      )}
      {state.matches("Searching") && (
        <div className="spinner" role="status" />
      )}
      {snapshot.matches("Selecting") && (
        <ul role="menu">
          {snapshot.context.results.map((result, index) => (
            <li
              key={result.pk}
              className={
                index === snapshot.context.highlightedIndex ? "highlighted" : ""
              }
              onClick={(event) => send({ type: "Select" })}
              onMouseMove={(event) =>
                send({ type: "Set Highlighted Index", index })
              }
              role="menuitem"
            >
              {result.fields.name}
            </li>
          ))}
        </ul>
      )}
      <pre>{JSON.stringify(snapshot.value)}</pre>
    </div>
  );
};