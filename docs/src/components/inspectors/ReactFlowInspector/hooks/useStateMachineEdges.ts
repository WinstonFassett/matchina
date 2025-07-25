import { useMemo, useCallback } from 'react';
import { MarkerType, useEdgesState } from 'reactflow';
import type { Edge, Node } from 'reactflow';
import { optimizeEdgeConnections } from '../utils/layoutCalculator';

interface Transition {
  from: string;
  to: string;
  event: string;
}

const extractTransitions = (machine: any): Transition[] => {
  const transitions: Transition[] = [];
  
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

export const useStateMachineEdges = (
  machine: any,
  nodes: Node[],
  currentState: string,
  previousState: string | null
) => {
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const transitions = useMemo(() => extractTransitions(machine), [machine]);

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
      
      const connectionPoints = optimizeEdgeConnections(fromPos, toPos);
      
      groupTransitions.forEach((transition, index) => {
        const isTransitionFromPrevious = previousState === transition.from && currentState === transition.to;
        const isPossibleExit = transition.from === currentState;
        
        // Calculate z-index based on priority: recent transition > current exits > inactive
        let zIndex = 1; // Default for inactive edges
        if (isPossibleExit) zIndex = 10; // Clickable edges on top
        if (isTransitionFromPrevious) zIndex = 20; // Recent transition highest
        
        // Handle multiple edges between same nodes
        let sourceHandle = connectionPoints.source;
        let targetHandle = connectionPoints.target;
        
        if (groupTransitions.length > 1 && index > 0) {
          const handles = ['top', 'right', 'bottom', 'left'];
          const sourceIndex = handles.indexOf(connectionPoints.source);
          const targetIndex = handles.indexOf(connectionPoints.target);
          sourceHandle = handles[(sourceIndex + index) % 4];
          targetHandle = handles[(targetIndex + index) % 4];
        }
        
        newEdges.push({
          id: `${transition.from}-${transition.to}-${transition.event}`,
          source: transition.from,
          target: transition.to,
          sourceHandle,
          targetHandle,
          type: 'default',
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
  }, [transitions, nodes, currentState, previousState, setEdges]);

  return {
    edges,
    onEdgesChange,
    updateEdges
  };
};