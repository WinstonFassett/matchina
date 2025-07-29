import { useMemo, useCallback } from "react";
import { MarkerType, useEdgesState } from "reactflow";
import type { Edge, Node } from "reactflow";
import { optimizeEdgeConnections } from "../utils/layoutCalculator";

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

    Object.entries(stateConfig.on).forEach(
      ([event, transitionConfig]: [string, any]) => {
        let targets: string[] = [];

        if (typeof transitionConfig === "string") {
          targets = [transitionConfig];
        } else if (Array.isArray(transitionConfig)) {
          targets = transitionConfig
            .map((config) =>
              typeof config === "string" ? config : config?.target
            )
            .filter(Boolean);
        } else if (transitionConfig?.target) {
          targets = [transitionConfig.target];
        }

        targets.forEach((target) => {
          transitions.push({ from: stateName, to: target, event });
        });
      }
    );
  });

  return transitions;
};

export const useStateMachineEdges = (
  machine: any,
  nodes: Node[],
  currentState: string,
  previousState?: string,
  edgesClickable: boolean = true
) => {
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const transitions = useMemo(() => extractTransitions(machine), [machine]);

  const updateEdges = useCallback(() => {
    if (!machine || nodes.length === 0) return;

    const nodePositions = new Map(
      nodes.map((node) => [node.id, node.position])
    );

    // Group transitions by source-target pairs to handle multiple events between same nodes
    const edgeGroupMap = new Map<string, Transition[]>();
    const selfTransitionMap = new Map<string, Transition[]>();

    // Organize transitions into groups
    transitions.forEach((transition) => {
      if (transition.from === transition.to) {
        // Self-transition
        if (!selfTransitionMap.has(transition.from)) {
          selfTransitionMap.set(transition.from, []);
        }
        selfTransitionMap.get(transition.from)!.push(transition);
      } else {
        // Regular transition
        const key = `${transition.from}-${transition.to}`;
        if (!edgeGroupMap.has(key)) {
          edgeGroupMap.set(key, []);
        }
        edgeGroupMap.get(key)!.push(transition);
      }
    });

    const newEdges: Edge[] = [];

    // Process regular transitions
    edgeGroupMap.forEach((groupTransitions, key) => {
      const [from, to] = key.split("-");
      const fromPos = nodePositions.get(from);
      const toPos = nodePositions.get(to);

      if (!fromPos || !toPos) return;

      const connectionPoints = optimizeEdgeConnections(fromPos, toPos);

      // For multiple transitions between the same nodes, distribute them evenly
      groupTransitions.forEach((transition, index) => {
        const isTransitionFromPrevious =
          previousState === transition.from && currentState === transition.to;
        const isPossibleExit = transition.from === currentState;

        // Calculate z-index based on priority: recent transition > current exits > inactive
        let zIndex = 1; // Default for inactive edges
        if (isPossibleExit) zIndex = 10; // Clickable edges on top
        if (isTransitionFromPrevious) zIndex = 20; // Recent transition highest

        // Handle multiple edges between same nodes with better distribution
        let sourceHandle = connectionPoints.source;
        let targetHandle = connectionPoints.target;

        if (groupTransitions.length > 1) {
          // Distribute edges evenly around the connection points
          const handles = ["top", "right", "bottom", "left"];

          // For 2 transitions, use opposite sides
          if (groupTransitions.length === 2) {
            const sourceIndex = handles.indexOf(connectionPoints.source);
            const targetIndex = handles.indexOf(connectionPoints.target);
            sourceHandle =
              index === 0
                ? connectionPoints.source
                : handles[(sourceIndex + 2) % 4];
            targetHandle =
              index === 0
                ? connectionPoints.target
                : handles[(targetIndex + 2) % 4];
          } else {
            // For 3+ transitions, distribute around all sides
            const sourceIndex = handles.indexOf(connectionPoints.source);
            const targetIndex = handles.indexOf(connectionPoints.target);
            sourceHandle = handles[(sourceIndex + index) % 4];
            targetHandle = handles[(targetIndex + index) % 4];
          }
        }

        newEdges.push({
          id: `${transition.from}-${transition.to}-${transition.event}`,
          source: transition.from,
          target: transition.to,
          sourceHandle,
          targetHandle,
          type: "custom", // Use custom edge type for proper rendering
          label: transition.event,

          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isTransitionFromPrevious
              ? "#60a5fa"
              : isPossibleExit
                ? "#2563eb"
                : "#94a3b8",
          },
          style: {
            stroke: isTransitionFromPrevious
              ? "#60a5fa"
              : isPossibleExit
                ? "#2563eb"
                : "#94a3b8",
            strokeWidth: isTransitionFromPrevious
              ? 3
              : isPossibleExit
                ? 2.5
                : 1.5,
            cursor: isPossibleExit ? "pointer" : "default",
            opacity: isTransitionFromPrevious ? 1 : isPossibleExit ? 0.9 : 0.4,
            strokeDasharray: isTransitionFromPrevious ? "5,5" : undefined,
            animation: isTransitionFromPrevious
              ? "dash 1s linear infinite"
              : undefined,
            zIndex,
          },
          labelStyle: {
            fontSize: "10px",
            fill: isTransitionFromPrevious
              ? "#60a5fa"
              : isPossibleExit
                ? "#2563eb"
                : "#94a3b8",
            fontWeight: 500,
          },
          zIndex,
          data: {
            event: transition.event,
            isClickable: edgesClickable && transition.from === currentState,
          },
        });
      });
    });

    // Process self-transitions with special loop handling
    selfTransitionMap.forEach((stateTransitions, stateId) => {
      const nodePos = nodePositions.get(stateId);
      if (!nodePos) return;

      // Distribute self-transitions around the node evenly
      stateTransitions.forEach((transition, index) => {
        const isTransitionFromPrevious =
          previousState === transition.from && currentState === transition.to;
        const isPossibleExit = transition.from === currentState;

        // Calculate z-index based on priority
        let zIndex = 1; // Default for inactive edges
        if (isPossibleExit) zIndex = 10; // Clickable edges on top
        if (isTransitionFromPrevious) zIndex = 20; // Recent transition highest

        newEdges.push({
          id: `${transition.from}-${transition.to}-${transition.event}`,
          source: transition.from,
          target: transition.to,
          type: "custom", // Use custom edge type for self-loops
          label: transition.event,

          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isTransitionFromPrevious
              ? "#60a5fa"
              : isPossibleExit
                ? "#2563eb"
                : "#94a3b8",
          },
          style: {
            stroke: isTransitionFromPrevious
              ? "#60a5fa"
              : isPossibleExit
                ? "#2563eb"
                : "#94a3b8",
            strokeWidth: isTransitionFromPrevious ? 4 : isPossibleExit ? 3 : 2, // Thicker lines for better visibility
            cursor: isPossibleExit ? "pointer" : "default",
            opacity: isTransitionFromPrevious ? 1 : isPossibleExit ? 0.9 : 0.6, // Higher opacity for better visibility
            zIndex,
          },
          labelStyle: {
            fontSize: "11px", // Slightly larger font
            fill: isTransitionFromPrevious
              ? "#60a5fa"
              : isPossibleExit
                ? "#2563eb"
                : "#94a3b8",
            fontWeight: isTransitionFromPrevious ? 700 : 500, // Bold for active transitions
          },
          zIndex,
          data: {
            event: transition.event,
            isClickable: edgesClickable && transition.from === currentState,
            isSelfTransition: true,
            selfLoopOffset: 30, // Smaller offset to keep loops closer to nodes
            // Distribute around the 4 sides of the node based on index
            selfLoopIndex: index % 4,
          },
        });
      });
    });

    // Sort edges by z-index to ensure proper layering
    const sortedEdges = newEdges.sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );
    setEdges(sortedEdges);
  }, [
    transitions,
    nodes,
    currentState,
    previousState,
    setEdges,
    machine,
    edgesClickable,
  ]);

  return {
    edges,
    onEdgesChange,
    updateEdges,
  };
};
