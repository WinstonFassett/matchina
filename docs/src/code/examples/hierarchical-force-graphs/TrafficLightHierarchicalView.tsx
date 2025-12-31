import HierarchicalForceGraph from '../../../components/HierarchicalForceGraphCustom';
import { useEffect, useState } from 'react';

export default function TrafficLightHierarchicalView() {
  const [graphData, setGraphData] = useState<any>(null);
  const [currentState, setCurrentState] = useState<string>('Working.Red');

  useEffect(() => {
    console.log('TrafficLightHierarchicalView: useEffect called');
    try {
      // Simplified test data without HSM machine
      const nodes = [
        // Compound states (level 0)
        { id: 'Working', name: 'Working', level: 0 },
        { id: 'Error', name: 'Error', level: 0 },
        
        // Working sub-states (level 1)
        { id: 'Working.Red', name: 'Red', group: 'Working', level: 1 },
        { id: 'Working.Green', name: 'Green', group: 'Working', level: 1 },
        { id: 'Working.Yellow', name: 'Yellow', group: 'Working', level: 1 },
        
        // Error sub-states (level 1)
        { id: 'Error.ErrorState', name: 'Error', group: 'Error', level: 1 },
        { id: 'Error.Recover', name: 'Recover', group: 'Error', level: 1 }
      ];

      const links = [
        // Working internal transitions
        { source: 'Working.Red', target: 'Working.Green', event: 'TIMER' },
        { source: 'Working.Green', target: 'Working.Yellow', event: 'TIMER' },
        { source: 'Working.Yellow', target: 'Working.Red', event: 'TIMER' },
        
        // Error internal transitions
        { source: 'Error.ErrorState', target: 'Error.Recover', event: 'RESET' },
        
        // Cross-group transitions
        { source: 'Error.Recover', target: 'Working', event: 'RESTART' }
      ];

      const data = { nodes, links };
      console.log('Setting graph data:', data);
      setGraphData(data);
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
  }, []);

  if (!graphData) {
    return <div>Loading...</div>;
  }

  // Handle event clicks to simulate state transitions
  const handleEventClick = (event: string) => {
    const transitions: Record<string, Record<string, string>> = {
      'Working.Red': { TIMER: 'Working.Green' },
      'Working.Green': { TIMER: 'Working.Yellow' },
      'Working.Yellow': { TIMER: 'Working.Red' },
      'Error.ErrorState': { RESET: 'Error.Recover' },
      'Error.Recover': { RESTART: 'Working.Red' },
    };
    const nextState = transitions[currentState]?.[event];
    if (nextState) {
      setCurrentState(nextState);
    }
  };

  return (
    <div>
      <h3>Traffic Light HSM - Hierarchical Force Graph</h3>
      <p>Demonstrating convex hull containers around compound states with force-directed layout.</p>
      <p style={{ fontSize: '12px', color: '#9ca3af' }}>
        Current state: <strong style={{ color: '#3b82f6' }}>{currentState}</strong> — Click an event label to transition
      </p>
      <HierarchicalForceGraph
        data={graphData}
        currentState={currentState}
        onEventClick={handleEventClick}
      />
    </div>
  );
}
