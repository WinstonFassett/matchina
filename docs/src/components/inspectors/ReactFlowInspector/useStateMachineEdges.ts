import { useMemo, useCallback } from 'react';
import { MarkerType, useEdgesState } from 'reactflow';
import type { Edge, Node } from 'reactflow';

interface Transition {
  from: string;
  to: string;
  event: string;
}

const extractTransitions = (definition: any): Transition[] => {
  const transitions: Transition[] = [];
  
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

export const useStateMachineEdges = (
  definition: any,
  nodes: Node[],
  currentState: string,
  previousState: string | null,
  lastEvent?: string
) => {
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const transitions = useMemo(() => extractTransitions(definition), [definition]);

  const updateEdges = useCallback(() => {
    const nodePositions = new Map(
      nodes.map(node => [node.id, node.position])
    );

    // Group transitions by node pairs to handle multiple events between same states
    const edgeGroups = new Map<string, Transition[]>();
    transitions.forEach(transition => {
      const key = `${transition.from}-${transition.to}`;
      if (!edgeGroups.has(key)) {
        edgeGroups.set(key, []);
      }
      edgeGroups.get(key)!.push(transition);
    });

    const newEdges: Edge[] = [];
    
    edgeGroups.forEach((groupTransitions, key) => {
      const [from, to] = key.split('-');
      const fromPos = nodePositions.get(from);
      const toPos = nodePositions.get(to);
      
      if (!fromPos || !toPos) return;
      
      groupTransitions.forEach((transition, index) => {
        const isTransitionFromPrevious = 
          previousState === transition.from && 
          currentState === transition.to && 
          lastEvent === transition.event;
        
        const isPossibleExit = transition.from === currentState;
        
        // Calculate z-index based on priority: recent transition > current exits > inactive
        let zIndex = 1; // Default for inactive edges
        if (isPossibleExit) zIndex = 10; // Clickable edges on top
        if (isTransitionFromPrevious) zIndex = 20; // Recent transition highest
        
        // Handle multiple edges between same nodes with slightly different curves
        const edgeType = groupTransitions.length > 1 ? 'smoothstep' : 'default';
        
        newEdges.push({
          id: `${transition.from}-${transition.to}-${transition.event}`,
          source: transition.from,
          target: transition.to,
          type: edgeType,
          label: transition.event,
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isTransitionFromPrevious ? '#60a5fa' : isPossibleExit ? '#2563eb' : '#94a3b8',
          },
          style: {
            stroke: isTransitionFromPrevious ? '#60a5fa' : isPossibleExit ? '#2563eb' : '#94a3b8',
            strokeWidth: isTransitionFromPrevious ? 3 : isPossibleExit ? 2.5 : 1.5,
            cursor: isPossibleExit ? 'pointer' : 'default',
            opacity: isTransitionFromPrevious ? 1 : isPossibleExit ? 0.9 : 0.4,
            strokeDasharray: isTransitionFromPrevious ? '5,5' : undefined,
            animation: isTransitionFromPrevious ? 'dash 1s linear infinite' : undefined,
            zIndex,
          },
          labelStyle: { 
            fontSize: '10px',
            fill: isTransitionFromPrevious ? '#60a5fa' : isPossibleExit ? '#2563eb' : '#94a3b8',
            fontWeight: 500,
          },
          zIndex,
          data: { 
            event: transition.event,
            isClickable: transition.from === currentState
          }
        });
      });
    });

    // Sort edges by z-index to ensure proper layering
    const sortedEdges = newEdges.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    setEdges(sortedEdges);
  }, [transitions, nodes, currentState, previousState, lastEvent, setEdges]);

  return {
    edges,
    onEdgesChange,
    updateEdges
  };
};
