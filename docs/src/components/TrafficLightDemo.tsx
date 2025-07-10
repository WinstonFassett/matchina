import { getXStateDefinition } from '@code/examples/StopwatchCommon'
import StateMachineMermaidDiagram from "@code/examples/MachineViz";
import { TrafficLight, trafficLight } from "@code/examples/TrafficLight";
import { useMemo } from 'react';
import { useMachine } from '@lib/src/integrations/react';
import { createApi } from '@lib/src';

export function TrafficLightDemo () {
  const config = useMemo(() => {
    return getXStateDefinition(trafficLight.machine)
  }, [trafficLight.machine])
  useMachine(trafficLight.machine)
  const actions = useMemo(() => createApi(trafficLight.machine, trafficLight.state.key), [trafficLight.state])

  return <div className='not-content flex items-center justify-around'>
     <TrafficLight />
     <StateMachineMermaidDiagram config={config} stateKey={trafficLight.state.key} actions={actions} />
  </div>
}