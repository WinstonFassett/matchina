import React, { useMemo, useState } from 'react';
import { createApi, createFactoryMachine, defineStates, effect, enter, getAvailableActions, guard } from "../src";
import { whenEventType, whenState } from "../src/factory-machine-hooks";
import { useMachine } from '../src/integrations/react';
import { MachineActions } from './MachineActions';
import { autotransition } from './autotransition';
import StateMachineMermaidDiagram from './MachineViz';
import { getXStateDefinition } from './StopwatchCommon';
import { delay } from '../src/extras/delay';
import { zen } from '../src/dev/zen';

type Options = RequestInit & {
  timeout?: number;
  maxTries?: number;
  autoretry?: boolean;
  getData?: (response: Response) => any;
};

export function createFetcher(
  defaultUrl: string, 
  defaultOptions: Options = {}
) {
  const states = defineStates({
    Idle: undefined,
    Fetching: (url = defaultUrl, options = defaultOptions) => ({ url, options, abort: new AbortController() }),
    ProcessingResponse: (response: Response) => response,
    Resolved: (data: any) => data,
    Error: (error: Error) => error,
    NetworkError: (error: Error) => error,
    Aborted: undefined,
    TimedOut: undefined,
    Refetching: undefined
  });
  const canRefetch = { refetch: "Refetching" } as const
  
  const machine = createFactoryMachine(states, 
    {
      Idle: {
        fetch: "Fetching"
      },
      Fetching: {
        fetched: "ProcessingResponse",
        reject: "Error",
        abort: "Aborted",
        timeout: "TimedOut",
        networkError: "NetworkError"
      },
      ProcessingResponse: {
        ...canRefetch,
        resolve: 'Resolved',
        error: "Error"
      },    
      Resolved: canRefetch,
      Error: canRefetch,
      NetworkError: canRefetch,
      Aborted: canRefetch,
      TimedOut: canRefetch,
      Refetching: { "": "Fetching" }
    } , 'Idle')
  const fetcher = extend(zen(machine), {
    fetch: (url?: string, options?: RequestInit) => {
      fetcher.fetch(url, options)
      return fetcher.promise!
    },
    promise: undefined as undefined | Promise<Response>,
    done: undefined as undefined | Promise<void>,
    tries: 0,
  })
  const maxTries = defaultOptions.maxTries ?? Number.POSITIVE_INFINITY
  const runFetch = async (url: string, options: RequestInit) => {
    fetcher.tries = fetcher.tries + 1
    const promise = fetcher.promise = fetch(url, options)
    try {
      const res = await promise
      if (fetcher.promise === promise) {     
        fetcher.fetched(res.clone())
      }
    } catch (error) {
      const { name } = error as Error
      if (name === 'AbortError') {
        fetcher.tries--
      } else if (name === 'TypeError') {
        fetcher.networkError(error as Error)
      } else {
        fetcher.reject(error as Error)
      }
    } finally {
      delete fetcher.promise
    }
  }
  const resolveResponseData = (response: Response) => response.json()
  fetcher.setup(
    enter(whenState('Fetching', ev => {
      (ev as any).promise = runFetch(ev.to.data.url, {
        ...ev.to.data.options, 
        signal: ev.to.data.abort.signal 
      })
      const { timeout } = ev.to.as('Fetching').data.options
      if (timeout) {
        const timer = setTimeout(fetcher.timeout, timeout)
        return () => clearTimeout(timer)
      }
    })),
    effect(whenState('ProcessingResponse', ev => {      
      fetcher.tries = 0
      delay(1000).then(() => {
        resolveResponseData(ev.to.data).then(fetcher.resolve) 
      })
    })),
    autotransition(),
    effect(whenEventType('abort', ev => { ev.from.data.abort.abort() })),
    guard(ev => ev.type === 'refetch'? fetcher.tries < maxTries : true),    
  )  
  if (defaultOptions.autoretry) {
    fetcher.setup(
      effect(whenState('NetworkError' , ev => {
        if (fetcher.tries < maxTries) {
          const backoff = 1000 * fetcher.tries
          const timer = setTimeout(() => {
            fetcher.refetch()
          }, backoff)
          return () => { clearTimeout(timer) }
        }
      }))
    )
  }
  return fetcher
}

export function FetcherDemo () {
  const [config, setConfig] = useState({ 
    retry: {
      limit: 10,
      methods: ['get'],
      statusCodes: [413],
      backoffLimit: 3000
    },
    maxTries: 5 
  })


  const fetcher = useMemo(() => {
    return createFetcher("https://httpbin.org/delay/1", {
      method: "GET",
      maxTries: config.maxTries,
      timeout: 1200,
      autoretry: true,
    });
  }, [config])
  useMachine(fetcher.machine)
  const { tries } = fetcher
  const definition = useMemo(() => getXStateDefinition(fetcher.machine), [fetcher.machine])
  const actions = useMemo(() => createApi(fetcher.machine, fetcher.state.key), [fetcher.state])
  return (
    <div>   
      <StateMachineMermaidDiagram config={definition} stateKey={fetcher.state.key} actions={actions} /> 
      {fetcher.state.key}, {tries}
      <MachineActions transitions={fetcher.machine.transitions} state={fetcher.state.key} send={fetcher.machine.send} children={undefined} />

      <pre>
        {fetcher.state.match({
          Resolved: (data) => JSON.stringify(data, null, 2),
          _: () => 'no data'
        })}
      </pre>
    </div>
  )
}

type Assign<Source, Destination> = Omit<Source, keyof Destination> & Destination;

function extend<Source extends object, Destination>(source: Source, destination: Destination): Assign<Source, Destination> {
  return Object.assign(source, destination) as Assign<Source, Destination>;
}