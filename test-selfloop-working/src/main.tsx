import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import FloatingApp from './FloatingApp';
import DynamicFloatingApp from './DynamicFloatingApp';
import ComprehensiveDemoApp from './ComprehensiveDemoApp';

const container = document.querySelector('#app');
if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <AppSwitcher />
    </React.StrictMode>
  );
};

type DemoMode = 'original' | 'dynamic' | 'comprehensive';

function AppSwitcher() {
  const [mode, setMode] = React.useState<DemoMode>('comprehensive');
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600' }}>Demo Mode:</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => setMode('original')}
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px',
              background: mode === 'original' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Original
          </button>
          <button 
            onClick={() => setMode('dynamic')}
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px',
              background: mode === 'dynamic' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dynamic
          </button>
          <button 
            onClick={() => setMode('comprehensive')}
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px',
              background: mode === 'comprehensive' ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            All Tests
          </button>
        </div>
      </div>
      
      {mode === 'original' && <FloatingApp />}
      {mode === 'dynamic' && <DynamicFloatingApp />}
      {mode === 'comprehensive' && <ComprehensiveDemoApp />}
    </div>
  );
}
