import { useMemo } from "react";
import { SearchBarView } from "./SearchBarView";
import { createSearchBarMachine } from "./machine";
import HSMVisualizerDemo from "../../../components/HSMVisualizerDemo";
import { useMachine } from "matchina/react";
import { getAvailableActions } from "matchina";

export function SearchBarWithVisualizers() {
  const machine = useMemo(createSearchBarMachine, []);
  const currentState = useMachine(machine);
  
  // Create action handlers for the visualizer - recalculate when state changes
  const actions = useMemo(() => {
    const currentState = machine.getState();
    const availableActions = getAvailableActions(machine.transitions, currentState.key);
    
    const actionMap: Record<string, () => void> = {};
    
    // Main machine actions
    availableActions.forEach((action: string) => {
      actionMap[action] = () => {
        try {
          machine.send(action);
        } catch (e) {
          console.warn(`Action ${action} failed:`, e);
        }
      };
    });
    
    // If we're in Active state, get actions from the active machine
    if (currentState.key === 'Active' && currentState.data.machine) {
      const activeMachine = currentState.data.machine;
      const activeState = activeMachine.getState();
      const activeActions = getAvailableActions(activeMachine.transitions, activeState.key);
      
      activeActions.forEach((action: string) => {
        actionMap[action] = () => {
          try {
            if (action === 'typed') {
              activeMachine.typed('demo query');
            } else if (action === 'highlight') {
              activeMachine.highlight(0);
            } else {
              (activeMachine as any)[action]();
            }
          } catch (e) {
            console.warn(`Active machine action ${action} failed:`, e);
          }
        };
      });
    }
    
    return actionMap;
  }, [machine, currentState]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Hierarchical Search Bar Demo</h2>
        <SearchBarView machine={machine} />
      </div>
      
      <div>
        <HSMVisualizerDemo
          machine={machine}
          actions={actions}
          title="State Machine Visualizers"
          description="This hierarchical state machine includes a main App machine (Inactive/Active) with a nested Active sub-machine that handles search states and async result fetching."
          defaultVisualizer="sketch"
          interactive={true}
        />
      </div>
      
      <div className="text-sm text-gray-600 space-y-2">
        <p><strong>Try these interactions:</strong></p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Click "Click to search" to activate the search bar</li>
          <li>Type "demo" to see results, or "err" to trigger an error</li>
          <li>Use the visualizer controls to switch between different views</li>
          <li>Click on transitions in the visualizers when they're available (highlighted)</li>
          <li>Notice how the sketch.systems-style inspector shows the nested hierarchy</li>
        </ul>
      </div>
    </div>
  );
}

export default SearchBarWithVisualizers;