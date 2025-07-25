import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useNodesState } from 'reactflow';
import type { Node } from 'reactflow';
import { getLayoutedElements, getDefaultLayoutOptions } from './elkLayout';
import type { LayoutOptions } from './elkLayout';

// Extract transitions from machine for ELK layout
const extractTransitionsForLayout = (definition: any) => {
  const transitions: Array<{ from: string; to: string; event: string }> = [];
  
  if (!definition?.states) return transitions;

  Object.entries(definition.states).forEach(([stateName, stateConfig]: [string, any]) => {
    if (!stateConfig?.on) return;
    
    Object.entries(stateConfig.on).forEach(([event, target]: [string, any]) => {
      if (target) {
        transitions.push({ from: stateName, to: target, event });
      }
    });
  });

  return transitions;
};

export const useStateMachineNodes = (
  definition: any,
  currentState: string,
  previousState: string | null,
  key?: number,
  layoutOptions?: LayoutOptions
) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const hasInitialized = useRef(false);
  const currentDefinitionId = useRef<string | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);
  const currentLayoutOptions = layoutOptions || getDefaultLayoutOptions();

  // Reset when key changes
  useEffect(() => {
    if (key !== undefined) {
      hasInitialized.current = false;
      setIsLayouting(false);
      setNodes([]);
    }
  }, [key, setNodes]);

  // Extract states from definition
  const states = useMemo(() => {
    if (!definition?.states) return [];
    return Object.keys(definition.states);
  }, [definition]);

  // Extract transitions for ELK layout
  const transitions = useMemo(() => extractTransitionsForLayout(definition), [definition]);

  // Reset when definition changes
  useEffect(() => {
    const definitionId = JSON.stringify(definition);
    if (definitionId !== currentDefinitionId.current) {
      hasInitialized.current = false;
      setIsLayouting(false);
      currentDefinitionId.current = definitionId;
    }
  }, [definition]);

  // Initialize layout only once per definition
  useEffect(() => {
    if (!hasInitialized.current && states.length > 0 && !isLayouting) {
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

  return {
    nodes,
    onNodesChange,
    isInitialized: hasInitialized.current,
    isLayouting
  };
};
