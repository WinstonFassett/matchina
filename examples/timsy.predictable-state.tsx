import React from "react";
import { createFactoryMachine, defineStates, withApi } from "../../src";
// ---cut---
type Data = { whatever: true };

const states = defineStates({
  NOT_LOADED: () => ({}),
  LOADING: () => ({}),
  LOADED: (data: Data) => ({ data }),
  ERROR: (error: Error) => ({ error }),
});

const dataMachine = withApi(
  createFactoryMachine(
    states,
    {
      NOT_LOADED: {
        load: () => () => states.LOADING(),
      },
      LOADING: {
        loadSuccess: (data: Data) => () => states.LOADED(data),
        loadError: (error: Error) => () => states.ERROR(error),
      },
      LOADED: {},
      ERROR: {},
    },
    "NOT_LOADED",
  ),
);

const DataComponent: React.FC = () => {
  // soon
  // const [state, events, useTransitionEffect] = useMachine(() =>
  //   dataMachine(states.NOT_LOADED())
  // )

  const state = dataMachine.getState();
  const { api } = dataMachine;

  // soon
  //useTransition("LOADING",
  const onLoad = () => {
    fetch("/data")
      .then((response) => response.json())
      .then(api.loadSuccess)
      .catch(api.loadError);
  };
  //)

  return (
    <div>
      {state.match({
        NOT_LOADED: () =>
          (
            <button
              onClick={() => {
                api.load();
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
