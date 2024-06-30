import React, { useState } from "react";
import { FactoryState, defineStates } from "../../src";
// ---cut---
const states = defineStates({
  NOT_LOADED: () => ({}),
  LOADING: () => ({}),
  LOADED: (data: { whatever: true }) => ({ data }),
  ERROR: (error: Error) => ({ error }),
});

type DataState = FactoryState<typeof states>;

const DataComponent: React.FC = () => {
  const [state, setState] = useState<DataState>(states.NOT_LOADED());

  return (
    <div>
      {state.match({
        NOT_LOADED: () =>
          (
            <button
              onClick={() => {
                fetch("/data")
                  .then((response) => response.json())
                  .then((data) => setState(states.LOADED(data)))
                  .catch((error) => setState(states.ERROR(error)));
              }}
            >
              Load Data
            </button>
          ) as any,
        LOADING: () => "Loading...",
        LOADED: ({ data }) => JSON.stringify(data),
        ERROR: ({ error }) => `ops, ${error.message}`,
      })}
    </div>
  );
};
