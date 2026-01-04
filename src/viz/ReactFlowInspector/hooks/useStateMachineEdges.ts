import { useMemo, useCallback } from "react";
import { MarkerType, useEdgesState } from "reactflow";
import type { Edge, Node } from "reactflow";
import { optimizeEdgeConnections } from "../utils/layoutCalculator";

interface Transition {
  from: string;
  to: string;
  event: string;
}

export const useStateMachineEdges = (
  initialEdges: Edge[],
  nodes: Node[],
  currentState: string,
  previousState?: string,
  interactive: boolean = true
) => {
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert edges to transitions for styling logic
  const transitions = useMemo(() => {
    return initialEdges.map((edge) => ({
      from: edge.source,
      to: edge.target,
      event: (edge.label as string) || "",
    }));
  }, [initialEdges]);

  const updateEdges = useCallback(() => {
    if (nodes.length === 0) return;

    const nodePositions = new Map(
      nodes.map((node) => [node.id, node.position])
    );

    // Group transitions by source-target pairs to handle multiple events between same nodes
    const edgeGroupMap = new Map<string, Transition[]>();
    const selfTransitionMap = new Map<string, Transition[]>();

    // Track bidirectional pairs (both A→B and B→A exist)
    const bidirectionalPairs = new Set<string>();

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

    // Detect bidirectional pairs - where both A→B and B→A exist
    edgeGroupMap.forEach((_, key) => {
      const [from, to] = key.split("-");
      const reverseKey = `${to}-${from}`;
      if (edgeGroupMap.has(reverseKey)) {
        // Create a normalized key for the pair (alphabetically sorted)
        const pairKey = [from, to].sort().join("-");
        bidirectionalPairs.add(pairKey);
      }
    });

    const newEdges: Edge[] = [];

    // For bidirectional pairs, collect ALL edges between the node pair for proper onion distribution
    // Key: normalized pair key (alphabetically sorted), Value: all transitions in both directions
    const bidirectionalEdgeGroups = new Map<string, { transition: Transition; from: string; to: string }[]>();

    edgeGroupMap.forEach((groupTransitions, key) => {
      const [from, to] = key.split("-");
      const pairKey = [from, to].sort().join("-");

      if (bidirectionalPairs.has(pairKey)) {
        if (!bidirectionalEdgeGroups.has(pairKey)) {
          bidirectionalEdgeGroups.set(pairKey, []);
        }
        groupTransitions.forEach(t => {
          bidirectionalEdgeGroups.get(pairKey)!.push({ transition: t, from, to });
        });
      }
    });

    // Process bidirectional edge groups with proper direction-based grouping
    bidirectionalEdgeGroups.forEach((allTransitions, pairKey) => {
      if (allTransitions.length > 1) {
        // Get node pair for direction determination
        const [nodeA, nodeB] = pairKey.split("-");
        
        console.log(`🔧 Direction Grouping ${pairKey}: ${allTransitions.length} total edges`);
        
        // Process all edges together, determining direction per edge
        allTransitions.forEach(({ transition, from, to }, index) => {
          const fromPos = nodePositions.get(from);
          const toPos = nodePositions.get(to);
          
          if (!fromPos || !toPos) return;

          // Detect layout: vertical (above/below) vs horizontal (side-by-side)
          // For clockwise flow: upper node exits right, lower node exits left
          const isVerticalLayout = Math.abs(fromPos.y - toPos.y) > Math.abs(fromPos.x - toPos.x);
          
          // Determine if this edge is A→B or B→A based on actual from/to
          const isFromA = from === nodeA;

          // LOG NODE POSITIONS FOR DEBUGGING
          console.log(`🔧 Processing Edge: ${transition.from}→${transition.to} (${transition.event})`);
          console.log(`  Node Positions: ${from}=(${fromPos.x.toFixed(1)}, ${fromPos.y.toFixed(1)}), ${to}=(${toPos.x.toFixed(1)}, ${toPos.y.toFixed(1)})`);
          console.log(`  Layout: ${isVerticalLayout ? 'VERTICAL' : 'HORIZONTAL'}`);
          console.log(`  Direction: ${isFromA ? 'A→B' : 'B→A'}`);
          console.log(`  Index: ${index}`);
          
          let sourceHandle: string;
          let targetHandle: string;
          let edgeOffset: number;
          
          if (isVerticalLayout) {
            // Vertical layout: upper node exits right, lower node exits left (clockwise)
            if (fromPos.y < toPos.y) {
              // from (upper) → to (lower): exit right side of upper, enter right side of lower
              sourceHandle = "right";
              targetHandle = "right";
              edgeOffset = 80 + (index * 60); // Increased from 40 to 60 for better label separation
            } else {
              // from (lower) → to (upper): exit left side of lower, enter left side of upper  
              sourceHandle = "left";
              targetHandle = "left";
              edgeOffset = -(80 + (index * 60)); // Increased from 40 to 60 for better label separation
            }
          } else {
            // Horizontal layout: left node exits top, right node exits bottom (clockwise)
            if (fromPos.x < toPos.x) {
              // from (left) → to (right): exit top side of left, enter top side of right
              sourceHandle = "top";
              targetHandle = "top";
              edgeOffset = -80 - (index * 40); // Negative = bow upward
            } else {
              // from (right) → to (left): exit bottom side of right, enter bottom side of left
              sourceHandle = "bottom";
              targetHandle = "bottom";
              edgeOffset = 80 + (index * 40); // Positive = bow downward
            }
          }
          
          const edge: Edge = {
            id: `${transition.from}-${transition.to}-${transition.event}`,
            source: transition.from,
            target: transition.to,
            sourceHandle,
            targetHandle,
            type: "custom",
            label: transition.event,
            data: {
              event: transition.event,
              isClickable: true,
              isEnabled: transition.from === currentState,
              edgeOffset,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: from === currentState ? "#1e40af" : "#6b7280",
            },
            style: {
              stroke: from === currentState ? "#1e40af" : "#6b7280",
              strokeWidth: from === currentState ? 3 : 2,
            },
          };

          newEdges.push(edge);
        });
      }
    });
    edgeGroupMap.forEach((groupTransitions, key) => {
      const [from, to] = key.split("-");
      const pairKey = [from, to].sort().join("-");
      
      // Skip if this was already processed as bidirectional
      if (bidirectionalPairs.has(pairKey)) {
        return;
      }
      
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

        // Check if this is part of a bidirectional pair
        const pairKey = [from, to].sort().join("-");
        const isBidirectional = bidirectionalPairs.has(pairKey);

        // Determine which side (left/right) this edge should use
        let side: 'left' | 'right' = 'left'; // default
        let edgeOffset = 0; // For onion layering within each direction

        if (isBidirectional) {
          // Like ForceGraph: one direction gets left, opposite direction gets right
          const [sortedFirst] = pairKey.split("-");
          const isForwardDirection = from === sortedFirst;
          side = isForwardDirection ? 'left' : 'right';

          // Onion layering: edges bend OUTWARD from each other (mirror effect)
          // Use enough spacing for labels (~50px width) to not overlap
          if (groupTransitions.length > 1) {
            const baseSpacing = 40; // Spacing for label separation
            // Alternate direction to bend outward from each other like onion rings
            // index 0: bend one way, index 1: bend opposite way
            const bendDirection = index % 2 === 0 ? 1 : -1;
            const layer = Math.floor(index / 2) + 1;
            edgeOffset = layer * baseSpacing * bendDirection;
          } else {
            // Single edge: small offset for cleaner look
            edgeOffset = 20 * (isForwardDirection ? 1 : -1);
          }
        } else if (groupTransitions.length > 1) {
          // Non-bidirectional with multiple edges: alternate sides + onion offset
          side = index % 2 === 0 ? 'left' : 'right';
          const layer = Math.floor(index / 2) + 1;
          edgeOffset = layer * 20 * (index % 2 === 0 ? 1 : -1);
        }

        // Use left/right handles based on side assignment
        const sourceHandle = side;
        const targetHandle = side;

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
                : 2, // Increased for visibility
            cursor: isPossibleExit ? "pointer" : "default",
            opacity: isTransitionFromPrevious ? 1 : isPossibleExit ? 0.9 : 0.8, // Increased for visibility
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
            isClickable: interactive,
            isEnabled: transition.from === currentState,
            edgeOffset, // For onion layering within each direction
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
            isClickable: interactive,
            isEnabled: transition.from === currentState,
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
    interactive,
  ]);

  return {
    edges,
    onEdgesChange,
    updateEdges,
  };
};
