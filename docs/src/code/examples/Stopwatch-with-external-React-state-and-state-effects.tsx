import { matchina } from "matchina";
import { useMachine } from "matchina/react";
import { useEffect, useMemo, useState } from "react";
import { StopwatchDevView, tickEffect, useEventTypeEffect, useStateEffects } from "./StopwatchCommon";

function useStopwatch(
  elapsed: number, 
  setElapsed: (elapsed: number) => void
) {
  // Define the state machine
  const stopwatch = useMemo(() => {
    const effects = {
      clear: () => setElapsed(0),
      run: () => {
        let lastTick = Date.now()
        return tickEffect(() => {
          const now = Date.now()
          setElapsed(stopwatch.elapsed + now - lastTick)
          lastTick = now
        })
      }
    }
    return Object.assign(matchina({
      Stopped: {  effects: [effects.clear] }, 
      Ticking: { effects: [effects.run] }, 
      Suspended: {},
    }, {
      Stopped: {
        start: 'Ticking'
      },
      Ticking: {
        stop: 'Stopped',
        suspend: 'Suspended',
        clear: 'Ticking'
      },
      Suspended: {
        stop: 'Stopped',
        resume: 'Ticking',
        clear: 'Suspended'
      }
    }, 'Stopped'), {
      elapsed,
      effects
    })}, [])
  useEffect(() => { stopwatch.elapsed = elapsed }, [elapsed])
  useMachine(stopwatch.machine)
  useStateEffects(stopwatch.state)
  useEventTypeEffect(stopwatch.change, stopwatch.effects)
  return stopwatch
}

export function Stopwatch () {  
  return <StopwatchDevView stopwatch={useStopwatch(...useState(0))} />
}
