import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { useNodesState } from "reactflow";
import type { Node, NodeChange } from "reactflow";
import {
  getLayoutedElements,
  getDefaultLayoutOptions,
} from "../utils/elkLayout";
import type { LayoutOptions } from "../utils/elkLayout";
import {
  saveNodePositions,
  loadNodePositions,
  clearNodePositions,
} from "../utils/layoutStorage";

// Extract transitions from shape tree for ELK layout (including hierarchical)
const extractTransitionsForLayout = (shapeTree: any) => {
  const transitions: Array<{ from: string; to: string; event: string }> = [];

  if (!shapeTree?.states) return transitions;
  
  // Handle both Map and Object formats for states
  const statesEntries: [string, any][] = shapeTree.states instanceof Map 
    ? Array.from(shapeTree.states.entries())
    : Object.entries(shapeTree.states);
  
  // Check if this is a hierarchical machine (has nested states)
  const hasNestedStates = statesEntries.some(([_, stateConfig]: [string, any]) => 
    stateConfig && typeof stateConfig === 'object' && stateConfig.states
  );
  
  if (!hasNestedStates) {
    // Flat machine - use simple extraction
    statesEntries.forEach(([stateName, stateConfig]: [string, any]) => {
      if (!stateConfig?.on) return;

      // Handle both Map and Object formats for transitions
      const onEntries: [string, any][] = stateConfig.on instanceof Map
        ? Array.from(stateConfig.on.entries())
        : Object.entries(stateConfig.on);

      onEntries.forEach(([event, transitionConfig]: [string, any]) => {
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
  }

  // Hierarchical machine - extract recursively
  const extractFromStates = (statesObj: any, prefix = '') => {
    if (!statesObj) return;

    const stateEntries: [string, any][] = statesObj instanceof Map
      ? Array.from(statesObj.entries())
      : Object.entries(statesObj);

    stateEntries.forEach(([stateName, stateConfig]: [string, any]) => {
      if (!stateConfig?.on) return;

      const fullStateName = prefix ? `${prefix}.${stateName}` : stateName;

      // Handle both Map and Object formats for transitions
      const onEntries: [string, any][] = stateConfig.on instanceof Map
        ? Array.from(stateConfig.on.entries())
        : Object.entries(stateConfig.on);

      onEntries.forEach(([event, transitionConfig]: [string, any]) => {
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
            // Handle relative targets - if target doesn't contain a dot, it's in the same level
            const fullTarget = !target.includes('.') && prefix ? `${prefix}.${target}` : target;
            transitions.push({ from: fullStateName, to: fullTarget, event });
          });
        }
      );

      // Recursively extract from nested states
      if (stateConfig?.states) {
        extractFromStates(stateConfig.states, fullStateName);
      }
    });
  };

  extractFromStates(shapeTree.states);
  return transitions;
};

export const useStateMachineNodes = (
  initialNodes: Node[],
  currentState: string,
  previousState?: string,
  key?: number,
  layoutOptions?: LayoutOptions,
  forceLayoutKey?: number,
  transitions: Array<{ from: string; to: string; event: string }> = []
) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([] as Node[]);
  const hasInitialized = useRef(false);
  const savePositionsTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isLayouting, setIsLayouting] = useState(false);
  const [isLayoutComplete, setIsLayoutComplete] = useState(false);
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

  // Use initialNodes directly (already extracted and formatted by wrapper)
  const states = useMemo(() => {
    return initialNodes.map((node) => node.id);
  }, [initialNodes]);





  // Initialize layout only once per machine
  useEffect(() => {
    if (!hasInitialized.current && states.length > 0 && !isLayouting) {
      console.log('🔍 [init] Starting layout initialization for', states.length, 'states');
      // Try to load saved positions first
      const machineId = machine?.id || machine?.config?.id || "unknown";
      const savedPositions = loadNodePositions(machineId);
      console.log('🔍 [init] Saved positions available:', savedPositions?.length || 0);

      if (savedPositions && savedPositions.length === states.length) {
        // Use saved positions
        console.log('🔍 [init] Using saved positions for machine', machineId);
        const restoredNodes: Node[] = states.map((state) => {
          const savedPos = savedPositions.find((p) => p.id === state);
          return {
            id: state,
            position: savedPos
              ? { x: savedPos.x, y: savedPos.y }
              : { x: 0, y: 0 },
            data: {
              label: (() => {
                // For flat machines, use simple state name. For hierarchical, show last part
                if (state.includes('.')) {
                  const parts = state.split('.');
                  const lastPart = parts[parts.length - 1];
                  return lastPart ? lastPart.charAt(0).toUpperCase() + lastPart.slice(1) : state;
                } else {
                  return state.charAt(0).toUpperCase() + state.slice(1);
                }
              })(),
              isActive: currentState === state,
              isPrevious: previousState === state,
            },
            type: "custom",
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
          label: (() => {
            // For flat machines, use simple state name. For hierarchical, show last part
            if (state.includes('.')) {
              const parts = state.split('.');
              const lastPart = parts[parts.length - 1];
              return lastPart ? lastPart.charAt(0).toUpperCase() + lastPart.slice(1) : state;
            } else {
              return state.charAt(0).toUpperCase() + state.slice(1);
            }
          })(),
          isActive: currentState === state,
          isPrevious: previousState === state,
        },
        type: "custom",
      }));

      // Create edges for ELK layout
      const initialEdges =
        transitions.length > 0
          ? transitions.map((transition, index) => ({
              id: `${transition.from}-${transition.to}-${transition.event}-${index}`,
              source: transition.from,
              target: transition.to,
            }))
          : [];

      // Use ELK to calculate optimal layout
      console.log('🔍 [ELK] Starting layout for', states.length, 'nodes with', transitions.length, 'transitions');
      getLayoutedElements(
        initialNodes,
        initialEdges,
        layoutOptions || getDefaultLayoutOptions()
      )
        .then(({ nodes: layoutedNodes }) => {
          console.log('🔍 [ELK] Layout succeeded. Returned positions:');
          layoutedNodes.forEach(n => {
            console.log(`  ${n.id}: x=${n.position.x}, y=${n.position.y}`);
          });
          const hasValidPositions = layoutedNodes.every(n => n.position.x !== 0 || n.position.y !== 0);
          console.log('🔍 [ELK] Has valid (non-zero) positions:', hasValidPositions);
          
          setNodes(layoutedNodes);
          hasInitialized.current = true;
          setHasManualChanges(false);
          setIsLayouting(false);
          setIsLayoutComplete(true); // Signal that layout is complete
          console.log('✅ [ELK] State updated, isLayoutComplete set to true');
          // Reset the flag after a short delay to allow for re-triggering
          setTimeout(() => setIsLayoutComplete(false), 1000);
        })
        .catch((error) => {
          console.error('❌ [ELK] Layout failed:', error);
          // Fallback to simple grid layout if ELK fails
          const fallbackNodes = initialNodes.map((node, index) => ({
            ...node,
            data: {
              ...node.data,
              // Ensure node has a valid shape for ELK layout
              elkNodeShape: "rectangle",
            },
            position: {
              x: (index % 3) * 200,
              y: Math.floor(index / 3) * 100,
            },
          }));
          console.log('🔍 [ELK] Using fallback grid layout:', fallbackNodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y })));
          setNodes(fallbackNodes);
          hasInitialized.current = true;
          setHasManualChanges(false);
          setIsLayouting(false);
          setIsLayoutComplete(true); // Signal that layout is complete
          // Reset the flag after a short delay to allow for re-triggering
          setTimeout(() => setIsLayoutComplete(false), 1000);
        });
    }
  }, [
    states,
    setNodes,
    currentState,
    previousState,
    isLayouting,
    key,
    layoutOptions,
    transitions,
  ]);

  // Update node states without changing positions
  const updateNodeStates = useCallback(() => {
    setNodes((currentNodes) => {
      console.log('🔍 [HSM] Updating active state highlighting');
      console.log('  currentState:', currentState, `(type: ${typeof currentState})`);
      console.log('  comparing against', currentNodes.length, 'nodes');
      const updated = currentNodes.map((node) => {
        const isActive = currentState === node.id;
        if (isActive || node.data?.isActive) {
          console.log(`  ${node.id}: isActive=${isActive} (was ${node.data?.isActive})`);
        }
        return {
          ...node,
          data: {
            ...node.data,
            isActive: currentState === node.id,
            isPrevious: previousState === node.id,
          },
        };
      });
      return updated;
    });
  }, [currentState, previousState, setNodes]);

  // Update states when they change
  useEffect(() => {
    if (hasInitialized.current) {
      updateNodeStates();
    }
  }, [updateNodeStates]);

  // Handle node changes (position, selection, etc)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Check if this is a position change (dragging)
      const positionChanges = changes.filter(
        (change) => change.type === "position"
      );

      // Track if user is actively dragging
      const isDragging = positionChanges.some(
        (change) =>
          change.type === "position" &&
          "dragging" in change &&
          change.dragging === true
      );

      // If user is dragging, mark as having manual changes
      if (isDragging) {
        setHasManualChanges(true);

        // Save node positions with debounce
        const machineId = machine?.id || machine?.config?.id || "unknown";
        clearTimeout(savePositionsTimeout.current);
        savePositionsTimeout.current = setTimeout(() => {
          const positions = nodes.map((node) => ({
            id: node.id,
            x: node.position.x,
            y: node.position.y,
          }));
          saveNodePositions(machineId, positions);
        }, 100);
      }

      // Apply the changes normally
      onNodesChange(changes);
    },
    [onNodesChange, nodes, machine?.id]
  );

  // Clear saved positions and force relayout
  const forceRelayout = useCallback(() => {
    const machineId = machine?.id || machine?.config?.id || "unknown";
    clearNodePositions(machineId);
    setHasManualChanges(false);
    hasInitialized.current = false;
  }, [machine]);

  // Force re-layout ONLY when forceLayoutKey changes (layout button clicked)
  // This prevents auto-layout during normal dragging operations
  useEffect(() => {
    // Only trigger layout if forceLayoutKey changed and is not the initial value
    if (
      forceLayoutKey !== undefined &&
      forceLayoutKey > 0 &&
      hasInitialized.current &&
      !isLayouting
    ) {
      setIsLayouting(true);

      // Create edges for ELK layout
      const initialEdges =
        transitions.length > 0
          ? transitions.map((transition, index) => ({
              id: `${transition.from}-${transition.to}-${transition.event}-${index}`,
              source: transition.from,
              target: transition.to,
            }))
          : [];

      // If user has made manual changes, preserve those positions as starting points
      // Otherwise use the current node positions
      const currentNodePositions = nodes.map((node) => ({
        ...node,
        // Keep positions but ELK will recalculate based on layout options
      }));

      // Use ELK to calculate optimal layout with current layout options
      getLayoutedElements(
        currentNodePositions,
        initialEdges,
        layoutOptions || getDefaultLayoutOptions()
      )
        .then(({ nodes: layoutedNodes }) => {
          setNodes(layoutedNodes);
          setHasManualChanges(false);
          setIsLayouting(false);
          setIsLayoutComplete(true); // Signal that layout is complete
        })
        .catch((error) => {
          setIsLayouting(false);
        });
    }
  }, [forceLayoutKey]); // Only depend on forceLayoutKey to prevent re-layouts during dragging

  return {
    nodes,
    onNodesChange: handleNodesChange,
    isInitialized: hasInitialized.current,
    isLayouting,
    hasManualChanges,
    isLayoutComplete,
    relayout: forceRelayout,
  };
};
