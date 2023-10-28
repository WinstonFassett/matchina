import React from "react";
import { defineMachine } from "../src";
import { defineStates } from "../src/states";

type Data = { whatever: true };

const states = defineStates({
  NOT_LOADED: () => ({}),
  LOADING: () => ({}),
  LOADED: (data: Data) => ({ data }),
  ERROR: (error: Error) => ({ error }),
});

const dataMachine = defineMachine(states, {
  NOT_LOADED: {
    load: () => () => states.LOADING(),
  },
  LOADING: {
    loadSuccess: (data: Data) => () => states.LOADED(data),
    loadError: (error: Error) => () => states.ERROR(error),
  },
  LOADED: {},
  ERROR: {},
}).create(states.NOT_LOADED());

const DataComponent: React.FC = () => {
  // soon
  // const [state, events, useTransitionEffect] = useMachine(() =>
  //   dataMachine(states.NOT_LOADED())
  // )

  const state = dataMachine.getState();
  const { event } = dataMachine;

  // soon
  //useTransition("LOADING",
  const onLoad = () => {
    fetch("/data")
      .then((response) => response.json())
      .then(event.loadSuccess)
      .catch(event.loadError);
  };
  //)

  return (
    <div>
      {state.match({
        NOT_LOADED: () => (
          <button
            onClick={() => {
              event.load();
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
