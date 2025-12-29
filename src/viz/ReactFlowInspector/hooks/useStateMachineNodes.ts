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
  const statesEntries = shapeTree.states instanceof Map 
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
      const onEntries = stateConfig.on instanceof Map
        ? Array.from(stateConfig.on.entries())
        : Object.entries(stateConfig.on);

      onEntries.forEach(
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
  }

  // Hierarchical machine - extract recursively
  const extractFromStates = (statesObj: any, prefix = '') => {
    if (!statesObj) return;

    const stateEntries = statesObj instanceof Map
      ? Array.from(statesObj.entries())
      : Object.entries(statesObj);

    stateEntries.forEach(([stateName, stateConfig]: [string, any]) => {
      if (!stateConfig?.on) return;

      const fullStateName = prefix ? `${prefix}.${stateName}` : stateName;

      // Handle both Map and Object formats for transitions
      const onEntries = stateConfig.on instanceof Map
        ? Array.from(stateConfig.on.entries())
        : Object.entries(stateConfig.on);

      onEntries.forEach(
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
  machine: any,
  currentState: string,
  previousState?: string,
  key?: number,
  layoutOptions?: LayoutOptions,
  forceLayoutKey?: number
) => {
  console.log('useStateMachineNodes CALLED with machine:', { machine, currentState });
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([] as Node[]);
  console.log('useStateMachineNodes - useNodesState initialized');
  
  const hasInitialized = useRef(false);
  const savePositionsTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentMachineId = useRef<string | null>(null);
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

  // Get shape directly from machine (like Sketch does)
  const shape = useMemo(() => {
    const shapeController = machine.shape;
    return shapeController?.getState();
  }, [machine]);

  // Extract states from shape (including nested states)
  const states = useMemo(() => {
    if (!shape?.states) return [];
    
    // DEBUG: Log the shape structure
    console.log('ReactFlow DEBUG - shape:', shape);
    console.log('ReactFlow DEBUG - shape.states is Map:', shape.states instanceof Map);
    
    // Handle both Map and Object formats for states
    const statesEntries = shape.states instanceof Map 
      ? Array.from(shape.states.entries())
      : Object.entries(shape.states);
    
    console.log('ReactFlow DEBUG - statesEntries:', statesEntries);
    
    // Check if this is a hierarchical machine (has nested states)
    const hasNestedStates = statesEntries.some(([_, stateConfig]: [string, any]) => 
      stateConfig && typeof stateConfig === 'object' && stateConfig.states
    );
    
    console.log('ReactFlow DEBUG - hasNestedStates:', hasNestedStates);
    
    if (!hasNestedStates) {
      // Flat machine - use simple state names
      const flatStates = statesEntries.map(([name, _]) => name);
      console.log('ReactFlow DEBUG - flat states:', flatStates);
      return flatStates;
    }
    
    // Hierarchical machine - extract all nested states
    const allStates: string[] = [];
    
    const extractStates = (shapeObj: any, prefix = '') => {
      if (!shapeObj?.states) return;
      
      Object.entries(shapeObj.states).forEach(([stateName, stateConfig]: [string, any]) => {
        const fullStateName = prefix ? `${prefix}.${stateName}` : stateName;
        allStates.push(fullStateName);
        
        // Recursively extract nested states
        if (stateConfig?.states) {
          extractStates(stateConfig, fullStateName);
        }
      });
    };
    
    extractStates(shape);
    console.log('ReactFlow DEBUG - hierarchical states:', allStates);
    return allStates;
  }, [shape]);

  // Extract transitions for ELK layout from shape
  const transitions = useMemo(
    () => extractTransitionsForLayout(shape),
    [shape]
  );

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
      const machineId = machine?.id || machine?.config?.id || "unknown";
      const savedPositions = loadNodePositions(machineId);

      if (savedPositions && savedPositions.length === states.length) {
        // Use saved positions
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
              isActive: (() => {
                // For flat machines, exact match. For hierarchical, check if current state ends with this state
                if (state.includes('.')) {
                  return currentState === state || currentState.endsWith('.' + state.split('.').pop());
                } else {
                  return currentState === state;
                }
              })(),
              isPrevious: (() => {
                // For flat machines, exact match. For hierarchical, check if previous state ends with this state
                if (!previousState) return false;
                if (state.includes('.')) {
                  return previousState === state || previousState.endsWith('.' + state.split('.').pop());
                } else {
                  return previousState === state;
                }
              })(),
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
          isActive: (() => {
            // For flat machines, exact match. For hierarchical, check if current state ends with this state
            if (state.includes('.')) {
              return currentState === state || currentState.endsWith('.' + state.split('.').pop());
            } else {
              return currentState === state;
            }
          })(),
          isPrevious: (() => {
            // For flat machines, exact match. For hierarchical, check if previous state ends with this state
            if (!previousState) return false;
            if (state.includes('.')) {
              return previousState === state || previousState.endsWith('.' + state.split('.').pop());
            } else {
              return previousState === state;
            }
          })(),
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
      getLayoutedElements(
        initialNodes,
        initialEdges,
        layoutOptions || getDefaultLayoutOptions()
      )
        .then(({ nodes: layoutedNodes }) => {
          setNodes(layoutedNodes);
          hasInitialized.current = true;
          setHasManualChanges(false);
          setIsLayouting(false);
          setIsLayoutComplete(true); // Signal that layout is complete
          // Reset the flag after a short delay to allow for re-triggering
          setTimeout(() => setIsLayoutComplete(false), 1000);
        })
        .catch((error) => {
          console.error("Layout failed, using fallback:", error);
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
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isActive: currentState === node.id,
          isPrevious: previousState === node.id,
        },
      }))
    );
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

      console.log("Forcing layout with key:", forceLayoutKey);

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
          console.error("Re-layout failed:", error);
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
