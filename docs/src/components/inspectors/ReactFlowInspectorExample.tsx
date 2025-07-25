import React, { useState, useEffect } from 'react';
import ReactFlowInspector from './ReactFlowInspector/ReactFlowInspector';

// Define types for our state machine definition
type StateConfig = {
  on?: Record<string, string>;
};

type MachineDefinition = {
  id: string;
  initial: string;
  states: Record<string, StateConfig>;
};

// Mock machine definitions for the example
const trafficLightDefinition: MachineDefinition = {
  id: 'trafficLight',
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
};

const checkoutDefinition: MachineDefinition = {
  id: 'checkout',
  initial: 'cart',
  states: {
    cart: {
      on: {
        CHECKOUT: 'payment',
      },
    },
    payment: {
      on: {
        BACK: 'cart',
        SUBMIT: 'processing',
      },
    },
    processing: {
      on: {
        SUCCESS: 'confirmation',
        ERROR: 'payment',
      },
    },
    confirmation: {
      on: {
        NEW_ORDER: 'cart',
      },
    },
  },
};

const ReactFlowInspectorExample: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<'traffic' | 'checkout'>('traffic');
  const [currentState, setCurrentState] = useState<string>('red');
  const [prevState, setPrevState] = useState<string>('');
  const [lastEvent, setLastEvent] = useState<string>('');
  
  // Get the current machine definition
  const definition = selectedMachine === 'traffic' ? trafficLightDefinition : checkoutDefinition;
  
  // Update current state when machine selection changes
  useEffect(() => {
    setCurrentState(definition.initial);
    setPrevState('');
    setLastEvent('');
  }, [selectedMachine, definition]);
  
  // Handle sending events to the machine
  const handleSendEvent = (eventType: string) => {
    const currentStateConfig = definition.states[currentState];
    if (currentStateConfig?.on && eventType in currentStateConfig.on) {
      setPrevState(currentState);
      setCurrentState(currentStateConfig.on[eventType]);
      setLastEvent(eventType);
    }
  };
  
  // Get available events for the current state
  const getAvailableEvents = () => {
    const currentStateConfig = definition.states[currentState];
    return currentStateConfig?.on ? Object.keys(currentStateConfig.on) : [];
  };
  
  const availableEvents = getAvailableEvents();
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">React Flow ELK State Machine Inspector</h2>
      
      <div className="mb-4">
        <div className="flex gap-4 mb-4">
          <button 
            className={`px-3 py-1 rounded ${selectedMachine === 'traffic' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedMachine('traffic')}
          >
            Traffic Light Machine
          </button>
          <button 
            className={`px-3 py-1 rounded ${selectedMachine === 'checkout' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedMachine('checkout')}
          >
            Checkout Machine
          </button>
        </div>
        
        <p className="mb-2">Current State: <span className="font-medium">{currentState}</span></p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {availableEvents.map(event => (
            <button 
              key={event}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              onClick={() => handleSendEvent(event)}
            >
              Send {event}
            </button>
          ))}
        </div>
      </div>
      
      <div className="border border-gray-300 rounded-lg">
        <ReactFlowInspector
          value={currentState}
          definition={definition}
          lastEvent={lastEvent}
          prevState={prevState}
          dispatch={(event) => event.type && handleSendEvent(event.type)}
        />
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Click on the "Layout" button in the top-right corner to customize the layout options.</p>
        <p>Click on the edges to trigger state transitions when available.</p>
      </div>
    </div>
  );
};

export default ReactFlowInspectorExample;
