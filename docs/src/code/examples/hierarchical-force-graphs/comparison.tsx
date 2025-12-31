import { useState } from 'react';
import TrafficLightHierarchicalView from './TrafficLightHierarchicalView';
import TrafficLightWebColaView from './TrafficLightWebColaView';

export default function ForceGraphComparison() {
  const [activeTab, setActiveTab] = useState<'custom' | 'webcola'>('custom');

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', borderBottom: '1px solid #ccc', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('custom')}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'custom' ? '#3b82f6' : '#666',
            color: '#fff',
            fontWeight: activeTab === 'custom' ? 'bold' : 'normal'
          }}
        >
          D3 Force + Convex Hull
        </button>
        <button
          onClick={() => setActiveTab('webcola')}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'webcola' ? '#3b82f6' : '#666',
            color: '#fff',
            fontWeight: activeTab === 'webcola' ? 'bold' : 'normal'
          }}
        >
          WebCola Constraint
        </button>
      </div>

      <div style={{ display: activeTab === 'custom' ? 'block' : 'none' }}>
        <TrafficLightHierarchicalView />
      </div>

      <div style={{ display: activeTab === 'webcola' ? 'block' : 'none' }}>
        <TrafficLightWebColaView />
      </div>
    </div>
  );
}
