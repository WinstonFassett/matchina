import React, { useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  ConnectionLineType,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { checkoutMachine } from '../machines/checkoutMachine';
import { trafficLightMachine } from '../machines/trafficLightMachine';
import { simpleMachine } from '../machines/simpleMachine';
import { fetchMachine } from '../machines/fetchMachine';
import CustomNode from './CustomNode';
import MachineControls from './MachineControls';
import { useStateMachineFlow } from './StateMachineFlow';
import LayoutPanel, { LayoutOptions } from './LayoutPanel';
import ExportPanel from './ExportPanel';
import { getDefaultLayoutOptions } from '../utils/elkLayout';
import { saveLayoutSettings, loadLayoutSettings, LayoutSettings, clearNodePositions } from '../utils/layoutStorage';
import { useStateMachineNodes } from '../hooks/useStateMachineNodes'
const nodeTypes = {
  custom: CustomNode,
};

const StateMachineVisualizer: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = React.useState('checkout');
  const [machineKey, setMachineKey] = React.useState(0);
  
  // Load saved layout settings or use defaults
  const [layoutOptions, setLayoutOptions] = React.useState<LayoutOptions>(() => {
    const saved = loadLayoutSettings();
    return saved || getDefaultLayoutOptions();
  });
  
  const layoutChangeRef = React.useRef<NodeJS.Timeout>();
  
  // Get the actual machine - this is the only machine-specific part
  const machine = useMemo(() => {
    switch (selectedMachine) {
      case 'traffic': return trafficLightMachine;
      case 'simple': return simpleMachine;
      case 'fetch': return fetchMachine;
      default: return checkoutMachine;
    }
  }, [selectedMachine]);

  // Force remount of flow when machine changes
  const handleMachineChange = (newMachine: string) => {
    setSelectedMachine(newMachine);
    setMachineKey(prev => prev + 1);
  };

  const handleRelayout = React.useCallback(() => {
    // Clear saved positions for current machine
    const machineId = machine?.id || 'unknown';
    clearNodePositions(machineId);
    // Force remount to trigger fresh layout
    setMachineKey(prev => prev + 1);
  }, [machine?.id]);

  const handleLayoutOptionsChange = React.useCallback((newOptions: LayoutOptions) => {
    setLayoutOptions(newOptions);
    
    // Save settings to localStorage
    saveLayoutSettings(newOptions as LayoutSettings);
    
    // Clear existing timeout
    if (layoutChangeRef.current) {
      clearTimeout(layoutChangeRef.current);
    }
    
    // Auto-apply layout after 300ms of no changes
    layoutChangeRef.current = setTimeout(() => {
      setMachineKey(prev => prev + 1);
    }, 300);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (layoutChangeRef.current) {
        clearTimeout(layoutChangeRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col relative">
      {/* Layout Panel - positioned absolutely outside the flow */}
      <div className="absolute top-20 right-4 z-50 space-y-2">
        <LayoutPanel
          options={layoutOptions}
          onOptionsChange={handleLayoutOptionsChange}
        />
        <ExportPanel
          selectedMachine={selectedMachine}
          machineId={machine?.id || 'unknown'}
          layoutOptions={layoutOptions}
        />
      </div>
      
      <MachineFlowDisplay 
        key={machineKey} 
        machine={machine} 
        machineKey={machineKey}
        selectedMachine={selectedMachine}
        onMachineChange={handleMachineChange}
        onRelayout={handleRelayout}
        layoutOptions={layoutOptions}
      />
    </div>
  );
};

// Separate component that gets completely remounted on machine change
const MachineFlowDisplay: React.FC<{ 
  machine: any; 
  machineKey: number;
  selectedMachine: string;
  onMachineChange: (machine: string) => void;
  onRelayout: () => void;
  layoutOptions: LayoutOptions;
}> = ({ 
  machine, 
  machineKey,
  selectedMachine,
  onMachineChange,
  onRelayout,
  layoutOptions
}) => {
  const flowProps = useStateMachineFlow(machine, machineKey, layoutOptions);
  const nodeHookResult = useStateMachineNodes(machine, flowProps.currentState, null, machineKey, layoutOptions);

  return (
    <>
      <MachineControls
        selectedMachine={selectedMachine}
        onMachineChange={onMachineChange}
        currentState={flowProps.currentState}
        availableEvents={flowProps.availableEvents}
        onEventTrigger={flowProps.onEventTrigger}
        onRelayout={onRelayout}
      />
      
      <div className="flex-1 relative">
        <ReactFlow
          nodes={flowProps.nodes}
          edges={flowProps.edges}
          nodeTypes={nodeTypes}
          onNodesChange={flowProps.onNodesChange}
          onEdgesChange={flowProps.onEdgesChange}
          onEdgeClick={flowProps.onEdgeClick}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Controls 
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          <Background variant="dots" gap={20} size={1} />
        </ReactFlow>
      </div>
    </>
  );
};

export default StateMachineVisualizer;