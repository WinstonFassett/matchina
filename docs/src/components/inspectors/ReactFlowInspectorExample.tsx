import React from 'react';
import { createMachine } from 'matchina';
import { useMachine } from 'matchina/react';
import ReactFlowInspector from './ReactFlowInspector';
import { getXStateDefinition } from '../../code/examples/lib/matchina-machine-to-xstate-definition';

// Simple traffic light machine for the example
const trafficLightMachine = createMachine({
  initial: 'red',
  states: {
    green: {
      on: {
        TIMER: 'yellow',
      },
    },
    yellow: {
      on: {
        TIMER: 'red',
      },
    },
    red: {
      on: {
        TIMER: 'green',
      },
    },
  },
});

const ReactFlowInspectorExample: React.FC = () => {
  const machine = useMachine(trafficLightMachine);
  const currentState = machine.state.key;
  const lastEvent = machine.lastEvent?.type;
  const prevState = machine.lastEvent?.from?.key;
  
  // Get the XState definition for visualization
  const definition = getXStateDefinition(trafficLightMachine);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">React Flow Inspector Example</h2>
      
      <div className="mb-4">
        <p className="mb-2">Current State: <span className="font-medium">{currentState}</span></p>
        
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded"
            onClick={() => trafficLightMachine.send('TIMER')}
          >
            Send TIMER Event
          </button>
        </div>
      </div>
      
      <div className="border rounded p-4">
        <ReactFlowInspector
          value={currentState}
          lastEvent={lastEvent}
          prevState={prevState}
          definition={definition}
          dispatch={({ type }) => trafficLightMachine.send(type)}
        />
      </div>
    </div>
  );
};

export default ReactFlowInspectorExample;
