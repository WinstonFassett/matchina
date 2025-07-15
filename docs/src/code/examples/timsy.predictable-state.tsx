import { createMachine, defineStates, effect, setup, whenState, withApi } from "matchina";
import { useMachine } from "matchina/react";
import React from "react";

type Data = { whatever: true };

const states = defineStates({
  NOT_LOADED: () => ({}),
  LOADING: () => ({}),
  LOADED: (data: Data) => ({ data }),
  ERROR: (error: Error) => ({ error }),
});

const createDataMachine = () => {
  const machine = withApi(
    createMachine(
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
  setup(machine)(
    effect(whenState("NOT_LOADED", () => {    
      fetch("/data")
        .then((response) => response.json())
        .then(machine.api.loadSuccess)
        .catch(machine.api.loadError)
    }))
  )
  return machine;
};

// TODO: fix TS here:
// const createDataMatchina = () =>
//   matchina(
//     states,
//     {
//       NOT_LOADED: {
//         load: () => () => states.LOADING(),
//       },
//       LOADING: {
//         loadSuccess: (data: Data) => () => states.LOADED(data),
//         loadError: (error: Error) => () => states.ERROR(error),
//       },
//       LOADED: {},
//       ERROR: {},
//     },
//     "NOT_LOADED",
//   )

export const DataComponent: React.FC = () => {
  const dataMachine = React.useMemo(() => createDataMachine(), []);
  useMachine(dataMachine);
  const state = dataMachine.getState();
  return (
    <div>
      {state.match({
        NOT_LOADED: () =>
          (
            <button
              onClick={() => {
                dataMachine.api.load();
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
