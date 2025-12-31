import HierarchicalWebCola from '../../../components/HierarchicalWebCola';
import { useEffect, useState } from 'react';

export default function TrafficLightWebColaView() {
  const [graphData, setGraphData] = useState<any>(null);
  const [currentState, setCurrentState] = useState<string>('Working.Red');
  const [layoutMode, setLayoutMode] = useState<'springy' | 'static'>('springy');

  useEffect(() => {
    console.log('TrafficLightWebColaView: useEffect called');
    try {
      // Same test data as custom force graph
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
      <h3>Traffic Light HSM - WebCola Constraint Layout</h3>
      <p>Demonstrating constraint-based layout with rectangular group containers.</p>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ fontSize: '12px', color: '#9ca3af' }}>
          Layout Mode:
          <select 
            value={layoutMode} 
            onChange={(e) => setLayoutMode(e.target.value as 'springy' | 'static')}
            style={{ marginLeft: '8px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #666' }}
          >
            <option value="springy">Springy (Animated)</option>
            <option value="static">Static (Fixed)</option>
          </select>
        </label>
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
          Current state: <strong style={{ color: '#3b82f6' }}>{currentState}</strong> — Click an event label to transition
        </span>
      </div>
      <HierarchicalWebCola
        data={graphData}
        currentState={currentState}
        onEventClick={handleEventClick}
        layoutMode={layoutMode}
      />
    </div>
  );
}
