import React, { useState } from "react";
import { StateFromFactory, defineStates } from "../src/states";

const states = defineStates({
  NOT_LOADED: () => ({}),
  LOADING: () => ({}),
  LOADED: (data: { whatever: true }) => ({ data }),
  ERROR: (error: Error) => ({ error }),
});

type DataState = StateFromFactory<typeof states>;

const DataComponent: React.FC = () => {
  const [state, setState] = useState<DataState>(states.NOT_LOADED());

  return (
    <div>
      {state.match({
        NOT_LOADED: () => (
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
        ),
        LOADING: () => "Loading...",
        LOADED: ({ data }) => JSON.stringify(data),
        ERROR: ({ error }) => `ops, ${error.message}`,
      })}
    </div>
  );
};
