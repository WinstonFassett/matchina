import { type AnyStatesFactory, type Disposer, type FactoryMachine, type FactoryMachineTransitions, type FactoryState, type StateMatchbox, type States, createApi, disposers, getAvailableActions as getStateEvents } from "matchina";
import { useEffect, useMemo } from "react";
import { StateMachineMermaidDiagram } from "./MachineViz";

export function tickEffect(
  tick: () => void,
  interval = 50
) {
  const timer = setInterval(tick, interval);
  return () => clearInterval(timer);
}

const StateData = {
  Stopped: () => ({ elapsed: 0 }),
  Ticking: (elapsed = 0, at = Date.now()) => ({ at, elapsed }),
  Suspended: (elapsed = 0) => ({ elapsed }),
}

interface Stopwatch {
  state: { key: keyof typeof StateData, data: any, match: any }
  elapsed: number
  machine: FactoryMachine<{states: any, transitions: any }>
  start (): void
  stop (): void
  suspend (): void
  resume (): void
  clear (): void
}

export function StopwatchView({ stopwatch }:{ stopwatch: Stopwatch }) {
  return <div className="p-4 rounded border">
    <div className={`inline ${stopwatch.state.match({
      Stopped: () => 'text-red-500',
      Ticking: () => 'text-green-500',
      Suspended: () => 'text-yellow-500',
    })}`}>
      {stopwatch.state.key}
    </div>
    <div className="text-4xl">
      {stopwatch.elapsed / 1000}s
    </div>
    <div className="flex items-center gap-2">
      {getStateEvents(stopwatch.machine.transitions, stopwatch.state.key).map(event => {
        return !event.startsWith('_') && <button className="rounded" key={event} onClick={() => {
          (stopwatch as any)[event]();
        } }>
          {event}
        </button>;
      })}
    </div>
  </div>;
}

export function StopwatchDevView ({ stopwatch }: { stopwatch: Stopwatch }) {
  const config = useMemo(() => getXStateDefinition(stopwatch.machine), [stopwatch.machine])
  const actions = useMemo(() => createApi(stopwatch.machine, stopwatch.state.key), [stopwatch.state])

  return <div style={{ width: '100%', display: 'flex', gap: '1em'}}>
    <div style={{flex: 2}}>
      <StopwatchView stopwatch={stopwatch} />
      <StateMachineMermaidDiagram config={config} stateKey={stopwatch.state.key} actions={actions} />
    </div>
    <pre className="text-xs flex-1">
      {JSON.stringify(stopwatch.change, null, 2)}
      {/* {JSON.stringify(getXStateDefinition(stopwatch.machine), null, 2)} */}
    </pre>
    
  </div>;
}

export function getStateValues<S extends AnyStatesFactory>(
  states: S
){
  return Object.entries(states).map(([key, value]) => value({}))
}

export function getXStateDefinition <F extends FactoryMachine<{ states: States<any>, transitions: any }>>(
  machine: F, 
  ) {
  const state = machine.getState()
  const stateValues = getStateValues(machine.states)
  const definition = {
    
    initial: state.key,
    states: {} as any,
    // on: {} as any,
  }
  for (const state of stateValues) {
    definition.states[state.key] = {
      // ...state,
      on: {} as any,
    }
  }
  // Object.entries(machine.states).forEach(([key, state]) => {
  //   definition.states[key] = {
  //     ...state,
  //     on: {} as any,
  //   }
  // })
  Object.entries(machine.transitions as object).forEach(([from, stateEvents]) => {
    Object.entries(stateEvents as object).forEach(([event, to]) => {
      definition.states[from].on[event] = resolveState(machine.states, to).key
    })
  })
  return definition
}

type Effect<T> = (state: T) => Disposer | void;

export function useStateEffects<S extends StateMatchbox<string, any>>(
  state: S,
  getEffects = (state: StateMatchbox<string, any>): Effect<S>[]| undefined => (state.data as any).effects
) {
  useEffect(() => {
    const effects = getEffects(state)
    if (!effects) return; 
    const unsubs = [] as Disposer[];
    for (const fn of effects) {
      const unsub = fn(state);
      if (unsub) {
        unsubs.push(unsub);
      }
    }
    return disposers(unsubs);
  }, [state]);
}

function useEffectMap<Deps extends unknown[]>(
  key: string, 
  effects: Record<string, (...deps: Deps) => void>, 
  deps = [] as unknown as Deps
) {
  useEffect(
    () => effects[key]?.apply(effects, deps),
    deps.concat(key)
  );
}

export function useEventTypeEffect<E extends { type: string }>(
  event: E,
  effects: Record<string, (event: E) => void>
) {  
  useEffectMap(event.type, effects, [event]);
}
// function resolveExitState(states: AnyStatesFactory, to: any): any {
//   return typeof to === 'string' ? resolveState(states, to) : 
// }

function resolveState<S extends AnyStatesFactory>(states: AnyStatesFactory, entry: TransitionEntry<any>): FactoryState<S> {
  if (typeof entry === 'string') {
    return states[entry]({} as any)// as FactoryState<S>
  }
  if (typeof entry === 'function') {
    const funcOrState = entry()
    let state: FactoryState<S>
    if (typeof funcOrState === 'function') {
      state = funcOrState()
      // return resolveState(funcOrState({}))
    }
    return resolveState(states, funcOrState)
  }
  return entry as any
}


type TransitionEntry<T extends FactoryMachineTransitions<any>> = 
  T extends { [key: string]: { exit: infer E } } ? E : never
