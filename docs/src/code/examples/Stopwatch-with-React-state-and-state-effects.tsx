import { matchina } from "matchina";
import { useMachine } from "matchina/react";
import { useMemo, useState } from "react";
import { StopwatchDevView, tickEffect, useEventTypeEffect, useStateEffects } from "./StopwatchCommon";

function useStopwatch() {
  const [elapsed, setElapsed] = useState(0) 
  const effects = useMemo(() => ({
    clear: () => setElapsed(0),
    run: () => {
      let lastTick = Date.now()
      return tickEffect(() => {
        const now = Date.now()
        setElapsed(stopwatch.elapsed + now - lastTick)
        lastTick = now
      })
    }
  }), [])
  // Define the state machine
  const stopwatch = useMemo(() => Object.assign(matchina({
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
  }), [])
  useMachine(stopwatch.machine)  
  useStateEffects(stopwatch.state)
  useEventTypeEffect(stopwatch.change, effects)
  stopwatch.elapsed = elapsed
  return stopwatch
}

export function Stopwatch () {
  const stopwatch = useStopwatch()
  return <StopwatchDevView stopwatch={stopwatch} />
}
