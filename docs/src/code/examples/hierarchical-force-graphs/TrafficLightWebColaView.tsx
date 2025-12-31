import HierarchicalWebCola from '../../../components/HierarchicalWebCola';
import { useEffect, useState } from 'react';

export default function TrafficLightWebColaView() {
  const [graphData, setGraphData] = useState<any>(null);

  useEffect(() => {
    // Same test data as custom force simulation
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

    setGraphData({ nodes, links });
  }, []);

  if (!graphData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h3>Traffic Light HSM - WebCola Layout</h3>
      <p>Using WebCola's constraint-based layout with automatic group bounds.</p>
      <HierarchicalWebCola data={graphData} />
    </div>
  );
}
