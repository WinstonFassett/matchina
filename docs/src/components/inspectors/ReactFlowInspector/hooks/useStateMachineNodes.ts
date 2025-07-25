import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useNodesState } from 'reactflow';
import type { Node } from 'reactflow';
import { getLayoutedElements, getDefaultLayoutOptions } from '../utils/elkLayout';
import type { LayoutOptions } from '../utils/elkLayout';
import { saveNodePositions, loadNodePositions, clearNodePositions } from '../utils/layoutStorage';

// Extract transitions from machine for ELK layout
const extractTransitionsForLayout = (machine: any) => {
  const transitions: Array<{ from: string; to: string; event: string }> = [];
  
  // Get states object from either machine.config.states or machine.states
  const states = machine?.config?.states || machine?.states;
  if (!states) return transitions;

  Object.entries(states).forEach(([stateName, stateConfig]: [string, any]) => {
    if (!stateConfig?.on) return;
    
    Object.entries(stateConfig.on).forEach(([event, transitionConfig]: [string, any]) => {
      let targets: string[] = [];
      
      if (typeof transitionConfig === 'string') {
        targets = [transitionConfig];
      } else if (Array.isArray(transitionConfig)) {
        targets = transitionConfig.map(config => 
          typeof config === 'string' ? config : config?.target
        ).filter(Boolean);
      } else if (transitionConfig?.target) {
        targets = [transitionConfig.target];
      }
      
      targets.forEach(target => {
        transitions.push({ from: stateName, to: target, event });
      });
    });
  });

  return transitions;
};

export const useStateMachineNodes = (
  machine: any,
  currentState: string,
  previousState: string | null,
  key?: number,
  layoutOptions?: LayoutOptions
) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const hasInitialized = useRef(false);
  const currentMachineId = useRef<string | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);
  const currentLayoutOptions = layoutOptions || getDefaultLayoutOptions();
  const [hasManualChanges, setHasManualChanges] = useState(false);

  // Reset when key changes (machine switch)
  useEffect(() => {
    if (key !== undefined) {
      hasInitialized.current = false;
      setIsLayouting(false);
      setHasManualChanges(false);
      setNodes([]);
    }
  }, [key, setNodes]);

  // Extract states from any machine structure (works with both machine.config.states and direct machine.states)
  const states = useMemo(() => {
    if (machine?.config?.states) return Object.keys(machine.config.states);
    if (machine?.states) return Object.keys(machine.states);
    return [];
  }, [machine]);

  // Extract transitions for ELK layout
  const transitions = useMemo(() => extractTransitionsForLayout(machine), [machine]);

  // Reset when machine changes
  useEffect(() => {
    if (machine?.id !== currentMachineId.current) {
      hasInitialized.current = false;
      setIsLayouting(false);
      setHasManualChanges(false);
      currentMachineId.current = machine?.id || null;
    }
  }, [machine]);

  // Initialize layout only once per machine
  useEffect(() => {
    if (!hasInitialized.current && states.length > 0 && !isLayouting) {
      // Try to load saved positions first
      const machineId = machine?.id || machine?.config?.id || 'unknown';
      const savedPositions = loadNodePositions(machineId);
      
      if (savedPositions && savedPositions.length === states.length) {
        // Use saved positions
        const restoredNodes: Node[] = states.map((state) => {
          const savedPos = savedPositions.find(p => p.id === state);
          return {
            id: state,
            position: savedPos ? { x: savedPos.x, y: savedPos.y } : { x: 0, y: 0 },
            data: { 
              label: state.charAt(0).toUpperCase() + state.slice(1),
              isActive: currentState === state,
              isPrevious: previousState === state
            },
            type: 'custom',
          };
        });
        
        setNodes(restoredNodes);
        hasInitialized.current = true;
        setHasManualChanges(true); // Mark as having manual positions
        return;
      }
      
      setIsLayouting(true);
      
      // Create initial nodes without positions (ELK will calculate them)
      const initialNodes: Node[] = states.map((state) => ({
        id: state,
        position: { x: 0, y: 0 }, // Temporary position
        data: { 
          label: state.charAt(0).toUpperCase() + state.slice(1),
          isActive: currentState === state,
          isPrevious: previousState === state
        },
        type: 'custom',
      }));

      // Create edges for ELK layout
      const initialEdges = transitions.length > 0 
        ? transitions.map((transition, index) => ({
            id: `${transition.from}-${transition.to}-${transition.event}-${index}`,
            source: transition.from,
            target: transition.to,
          }))
        : [];

      // Use ELK to calculate optimal layout
      getLayoutedElements(initialNodes, initialEdges, currentLayoutOptions)
        .then(({ nodes: layoutedNodes }) => {
          setNodes(layoutedNodes);
          hasInitialized.current = true;
          setHasManualChanges(false);
          setIsLayouting(false);
        })
        .catch((error) => {
          console.error('Layout failed, using fallback:', error);
          // Fallback to simple grid layout if ELK fails
          const fallbackNodes = initialNodes.map((node, index) => ({
            ...node,
            position: { 
              x: (index % 3) * 200, 
              y: Math.floor(index / 3) * 100 
            }
          }));
          setNodes(fallbackNodes);
          hasInitialized.current = true;
          setHasManualChanges(false);
          setIsLayouting(false);
        });
    }
  }, [states, setNodes, currentState, previousState, isLayouting, key, currentLayoutOptions, transitions]);

  // Update node states without changing positions
  const updateNodeStates = useCallback(() => {
    setNodes(currentNodes => 
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isActive: currentState === node.id,
          isPrevious: previousState === node.id
        }
      }))
    );
  }, [currentState, previousState, setNodes]);

  // Update states when they change
  useEffect(() => {
    if (hasInitialized.current) {
      updateNodeStates();
    }
  }, [updateNodeStates]);

  // Save node positions when they change (for manual positioning)
  const handleNodesChange = useCallback((changes: any[]) => {
    // Check if this is a position change
    const hasPositionChange = changes.some(change => 
      change.type === 'position' && change.position
    );
    
    if (hasPositionChange) {
      setHasManualChanges(true);
      
      // Save positions after a short delay to avoid excessive saves
      setTimeout(() => {
        const machineId = machine?.id || machine?.config?.id || 'unknown';
        const positions = nodes.map(node => ({
          id: node.id,
          x: node.position.x,
          y: node.position.y
        }));
        saveNodePositions(machineId, positions);
      }, 100);
    }
    
    // Apply the changes normally
    onNodesChange(changes);
  }, [onNodesChange, nodes, machine?.id]);

  // Clear saved positions and force relayout
  const forceRelayout = useCallback(() => {
    const machineId = machine?.id || machine?.config?.id || 'unknown';
    clearNodePositions(machineId);
    setHasManualChanges(false);
    hasInitialized.current = false;
  }, [machine]);

  return {
    nodes,
    onNodesChange: handleNodesChange,
    isInitialized: hasInitialized.current,
    isLayouting,
    hasManualChanges,
    relayout: forceRelayout
  };
};