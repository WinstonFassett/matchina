import React, { useCallback, useMemo } from 'react';
import { createApi, createFactoryMachine, defineStates, effect, setup } from "../src";
import { zen } from '../src/dev/zen';
import { delay } from '../src/extras/delay';
import { useMachine } from '../src/integrations/react';
import StateMachineMermaidDiagram from './MachineViz';
import { getXStateDefinition } from './StopwatchCommon';


function usePromise(fn: (...args: any[]) => Promise<any>) {
  const model = useMemo(() => {
    const states = defineStates({
      Idle: undefined,
      Pending: (...args: any[]) => args,
      Resolved: (data: Awaited<ReturnType<typeof fn>>) => data,
      Rejected: (error: Error) => error
    })
    const machine = createFactoryMachine(states, {
      Idle: {
        execute: "Pending"
      },
      Pending: {
        resolve: "Resolved",
        reject: "Rejected"
      },
    }, 'Idle')
    const view = Object.assign(zen(machine), {
      promise: undefined as undefined | ReturnType<typeof fn>,
      done: undefined as undefined | Promise<void>
    })    
    setup(view.machine)(
      effect(change => {
        if (change.type !== "execute") return
        const promise = fn(...change.params)
        view.promise = promise
        // needed if multiple invocations are allowed by machine
        const iffPromiseMatches = (fn: (...args: any[]) => any) => {
          return (...args: any[]) => {
            if (promise === view.promise) return fn(...args)
          }
        }
        view.done = promise
          .then(iffPromiseMatches(view.resolve))
          .catch(iffPromiseMatches(view.reject))
          .finally(() => {
            delete view.promise
            delete view.done
          })
      })
    )
    return view
  }, [fn])
  useMachine(model.machine)
  return model;
}

export function SimpleFetchDemo () {
  const [version, setVersion] = React.useState({})
  const reset = useCallback(() => setVersion({}), [])
  const fetcher = usePromise(useCallback(async (ms = 1000) => {
    await delay(ms)
    return "Hello World"
  }, [version]))
  const def = useMemo(() => getXStateDefinition(fetcher.machine), [fetcher.machine])
  const actions = useMemo(() => createApi(fetcher.machine, fetcher.state.key as any), [fetcher.state.key])
  return <div>
    <div>{fetcher.state.key}</div>
    {fetcher.state.key === "Resolved" && <pre>{fetcher.state.data}</pre>}
    {fetcher.state.match({
      Idle: () => <button onClick={() => actions.execute(1000)}>Say hello</button>,
      Pending: () => <div>Hang tight</div>,
      Resolved: () => <button onClick={reset}>Reset</button>
    }, false)}
    <StateMachineMermaidDiagram config={def} stateKey={fetcher.state.key} actions={actions} />    
  </div>
}