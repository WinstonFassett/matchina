import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useMachine } from '../../integrations/react';
import type { TransitionEvent } from '../../state-machine';
import type { StateNode, MachineShape } from '../../hsm/shape-types';
import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import ReactFlowInspectorV2 from './ReactFlowInspectorV2';
import {
  layoutManager,
  LayoutType,
  type AnyLayoutSettings,
} from './layout';
import { HSMLayoutControls } from './ui/HSMLayoutControls';
import { getReactFlowPreset } from '../ReactFlowInspector/presets';

interface HSMReactFlowInspectorV2Props {
  machine: {
    shape?: { getState(): MachineShape };
    send(event: string): void;
    notify: (ev: TransitionEvent) => void;
    getChange: () => TransitionEvent;
  };
  interactive?: boolean;
  exampleName?: string; // Add exampleName for V1 parity
}

interface NodeData extends Record<string, unknown> {
  label: string;
  isActive?: boolean;
  isPrevious?: boolean;
  isCompound?: boolean;
  stateKey?: string;
}

interface EdgeData extends Record<string, unknown> {
  event?: string;
  isClickable?: boolean;
  isActive?: boolean;
}

/**
 * Convert machine shape to ReactFlow nodes and edges using layout system
 * 
 * Key hierarchy handling:
 * 1. Identify compound states (states that have children via shape.hierarchy)
 * 2. Mark compound states with type: 'group' for visual container rendering
 * 3. Set parentId + extent: 'parent' on child nodes to constrain them inside parents
 */
async function shapeToReactFlow(shape: MachineShape, layoutType: LayoutType, settings: AnyLayoutSettings): Promise<{ nodes: Node<NodeData>[]; edges: Edge<EdgeData>[] }> {
  const nodes: Node<NodeData>[] = [];
  const edges: Edge<EdgeData>[] = [];
  const nodeIds = new Set<string>();

  // Step 1: Identify compound states (states that have children)
  const compoundStates = new Set<string>();
  for (const [_childKey, parentKey] of shape.hierarchy.entries()) {
    if (parentKey) {
      compoundStates.add(parentKey);
    }
  }

  // Step 2: Create nodes with hierarchy information
  for (const [fullKey, stateNode] of shape.states.entries()) {
    const parentKey = shape.hierarchy.get(fullKey);
    const isCompound = compoundStates.has(fullKey);

    // Convert dots to underscores for ReactFlow compatibility
    const nodeId = fullKey.replace(/\./g, '_');
    const parentNodeId = parentKey?.replace(/\./g, '_');

    // Use 'group' type for compound states, 'simple' for leaf states
    const nodeType = isCompound ? 'group' : 'simple';

    const node: Node<NodeData> = {
      id: nodeId,
      type: nodeType,
      data: {
        label: stateNode.key, // Display leaf name only
        stateKey: fullKey,    // Store full key for matching
        isCompound,
      },
      position: { x: 0, y: 0 }, // Layout engine will position
    };

    // Assign parent relationship for child nodes
    if (parentNodeId) {
      (node as any).parentId = parentNodeId;
      (node as any).extent = 'parent'; // Constrain child inside parent bounds
    }

    nodes.push(node);
    nodeIds.add(nodeId);
  }

  // Create edges from transitions
  shape.transitions.forEach((transitions, fromState) => {
    transitions.forEach((toState, event) => {
      // Handle special syntax like '^Inactive' (exit to parent)
      let targetState = toState;
      if (toState.startsWith('^')) {
        targetState = toState.substring(1);
      }

      // Convert dots to underscores for edge source/target
      const sourceId = fromState.replace(/\./g, '_');
      let targetId = targetState.replace(/\./g, '_');
      
      // For flattened mode, target might not have parent prefix
      // Try to find the full target ID if the simple one doesn't exist
      if (!nodes.find(n => n.id === targetId)) {
        // Look for a node that ends with the target name
        const fullTargetNode = nodes.find(n => n.id.endsWith(`_${targetId}`));
        if (fullTargetNode) {
          targetId = fullTargetNode.id;
        }
      }

      edges.push({
        id: `${fromState}-${toState}-${event}`,
        source: sourceId,
        target: targetId,
        label: event,
        type: 'floating',
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        data: {
          event,
        },
      });
    });
  });

  // Apply layout - handle async ELK engines
  const layoutResult = await layoutManager.calculateLayout(layoutType, nodes, edges, settings as any);
  
  // Safety check: Filter out any nodes with NaN positions
  const validNodes = layoutResult.nodes.filter(node => 
    Number.isFinite(node.position.x) && Number.isFinite(node.position.y)
  );
  
  // Safety check: Filter out any edges that reference invalid nodes
  const validNodeIds = new Set(validNodes.map(n => n.id));
  const validEdges = layoutResult.edges.filter(edge => 
    validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
  );
  
  // Log if we filtered anything
  if (validNodes.length !== layoutResult.nodes.length || validEdges.length !== layoutResult.edges.length) {
    console.warn('🚨 Filtered invalid nodes/edges:', {
      originalNodes: layoutResult.nodes.length,
      validNodes: validNodes.length,
      originalEdges: layoutResult.edges.length,
      validEdges: validEdges.length
    });
  }
  
    
  return {
    nodes: validNodes as Node<NodeData>[],
    edges: validEdges as Edge<EdgeData>[],
  };
}

/**
 * HSMReactFlowInspectorV2 - Adapter that converts HSM machine shape to ReactFlow V2 format
 *
 * This wrapper handles:
 * 1. Shape extraction from machine
 * 2. Conversion to ReactFlow nodes/edges
 * 3. State change subscription for highlighting
 * 4. Event dispatch for interactive transitions
 */
export const HSMReactFlowInspectorV2: React.FC<HSMReactFlowInspectorV2Props> = ({
  machine,
  interactive = true,
  exampleName,
}) => {
  // Layout state
  const [layoutType, setLayoutType] = useState<LayoutType>(LayoutType.HIERARCHICAL);
  const [layoutSettings, setLayoutSettings] = useState<AnyLayoutSettings>(() => {
    // Try example-specific preset first (V1 parity)
    if (exampleName) {
      const preset = getReactFlowPreset(exampleName);
      // Convert V1 preset to V2 layout settings
      const engine = layoutManager.getEngine(LayoutType.HIERARCHICAL); // V1 uses ELK which is hierarchical
      if (engine && preset.layoutOptions) {
        const v1Options = preset.layoutOptions;
        const defaultSettings = engine.getDefaultSettings();
        return {
          ...defaultSettings,
          // Map V1 ELK options to V2 settings
          nodeSpacing: v1Options.nodeSpacing || defaultSettings.nodeSpacing,
          edgeSpacing: v1Options.edgeSpacing || defaultSettings.edgeSpacing,
          layerSpacing: v1Options.layerSpacing || defaultSettings.layerSpacing,
          algorithm: v1Options.algorithm || 'layered',
          direction: v1Options.direction || 'DOWN',
          thoroughness: v1Options.thoroughness || defaultSettings.thoroughness,
          compactComponents: v1Options.compactComponents || defaultSettings.compactComponents,
          separateComponents: v1Options.separateComponents || defaultSettings.separateComponents,
          componentSpacing: v1Options.componentSpacing || defaultSettings.componentSpacing,
          edgeNodeSpacing: v1Options.edgeNodeSpacing || defaultSettings.edgeNodeSpacing,
        };
      }
    }
    
    // Fallback to default
    const engine = layoutManager.getEngine(LayoutType.HIERARCHICAL);
    return engine?.getDefaultSettings() ?? {
      nodeSpacing: 120,
      edgeSpacing: 20,
      fitPadding: 20,
      animationDuration: 300,
      compactness: 0.7,
      alignment: 'center',
      direction: 'row',
    };
  });

  // Step 1: Extract shape structure (nodes/edges) - only when machine shape changes
  // Use a stable key based on shape structure, not state
  const [machineShape, setMachineShape] = useState<MachineShape | null>(null);
  const [shapeKey, setShapeKey] = useState<string>('');
  
  // Track machine shape changes (not state changes)
  useEffect(() => {
    const shape = machine.shape?.getState();
    
    if (shape) {
      // Create a stable key based on the shape's structure (states and transitions)
      // This should only change when the actual machine structure changes, not state
      const stateIds = Array.from(shape.states.keys()).sort().join(',');
      const transitionIds = Array.from(shape.transitions.keys()).sort().join(',');
      const newKey = `${stateIds}|${transitionIds}`;
      
      if (newKey !== shapeKey) {
        setShapeKey(newKey);
        setMachineShape(shape);
      }
    } else {
      setMachineShape(null);
      setShapeKey('');
    }
  }, [machine.shape, shapeKey]);

  // Step 2: Convert to ReactFlow format with layout (async)
  const [graphData, setGraphData] = useState<{ nodes: Node<NodeData>[]; edges: Edge<EdgeData>[] } | null>(null);
  const layoutRef = useRef<{ startTime: number }>({ startTime: 0 });
  
  // Create a layout key that changes when layout parameters change
  const layoutKey = useMemo(() => {
    const shape = machine.shape?.getState();
    if (!shape) return '';
    const stateIds = Array.from(shape.states.keys()).sort().join(',');
    const settingsStr = JSON.stringify(layoutSettings);
    return `${stateIds}-${layoutType}-${settingsStr}`;
  }, [machine.shape, layoutType, layoutSettings]);
  
  useEffect(() => {
    if (!machineShape) {
      setGraphData(null);
      return;
    }
    
    let cancelled = false;
    const startTime = Date.now();
    layoutRef.current.startTime = startTime;
    
    shapeToReactFlow(machineShape, layoutType, layoutSettings)
      .then(result => {
        if (!cancelled && startTime === layoutRef.current.startTime) {
          setGraphData(result);
        }
      })
      .catch(error => {
        console.error('Layout calculation failed:', error);
        if (!cancelled && startTime === layoutRef.current.startTime) {
          setGraphData(null);
        }
      });
      
    return () => {
      cancelled = true;
    };
  }, [layoutKey, machineShape, layoutType, layoutSettings]);

  // Step 3: Subscribe to state changes for highlighting
  const deepestMachine = (() => {
    let cursor: any = machine;
    let last: any = machine;
    let guard = 0;
    while (cursor && guard++ < 25) {
      last = cursor;
      const s = cursor.getState?.();
      const next = s?.data?.machine;
      if (!next) break;
      cursor = next;
    }
    return last;
  })();

  // Subscribe to deepest machine for reactivity
  const currentChange = useMachine(deepestMachine || machine) as TransitionEvent<StateNode, StateNode>;

  // Compute full state path
  const fullPath = (() => {
    const currentMachineState = machine.shape?.getState();
    const stateKey = currentMachineState?.initialKey || '';

    // If state key already contains dots, it's a flattened full path
    if (stateKey.includes('.')) {
      return stateKey;
    }

    // Otherwise, walk nested machines to build full path
    const parts: string[] = [];
    let cursor: any = machine;
    let guard = 0;
    while (cursor && guard++ < 25) {
      const s = cursor.getState?.();
      if (!s) break;
      parts.push(s.key);
      cursor = s?.data?.machine;
    }
    return parts.join('.');
  })();

  // Node IDs use underscores instead of dots
  const currentState = fullPath.replace(/\./g, '_');

  // Step 4: Get previous state for edge highlighting
  const rawPreviousState = currentChange?.from?.fullKey || currentChange?.from?.key || String(currentChange?.from || '');
  const previousState = rawPreviousState.replace(/\./g, '_');

  // Step 5: Create dispatch function for edge clicks
  const dispatch = useCallback(
    (event: { type: string }) => {
      machine.send(event.type);
    },
    [machine]
  );

  // Step 6: Initialize with example-specific layout for V1 parity
  useEffect(() => {
    // Check URL parameters first for layout override
    const urlParams = new URLSearchParams(window.location.search);
    const urlLayout = urlParams.get('layout');
    
    if (urlLayout) {
      // URL parameter takes precedence
      const layoutType = urlLayout as LayoutType;
      
      // Map URL layout parameter to preset ID
      const presetId = layoutType === 'hierarchical' ? 'hierarchical-topdown' :
                      layoutType === 'tree' ? 'tree-vertical' :
                      layoutType === 'force' ? 'force-balanced' :
                      layoutType === 'organic' ? 'organic-clustered' :
                                            null;
      
      if (presetId) {
        const preset = layoutManager.getPreset(presetId);
        if (preset) {
          setLayoutType(preset.layoutType);
          setLayoutSettings(preset.settings);
          return;
        }
      }
    }
    
    // Try example-specific preset first (V1 parity)
    if (exampleName) {
      const preset = getReactFlowPreset(exampleName);
      if (preset?.layoutOptions) {
        // Convert V1 preset to V2 layout
        const v1Options = preset.layoutOptions;
        
        const layoutType = v1Options.algorithm === 'layered' ? LayoutType.HIERARCHICAL :
                          v1Options.algorithm === 'mrtree' ? LayoutType.TREE :
                          v1Options.algorithm === 'force' ? LayoutType.FORCE_DIRECTED :
                          v1Options.algorithm === 'stress' ? LayoutType.ORGANIC :
                                                    LayoutType.HIERARCHICAL;
        
        const engine = layoutManager.getEngine(layoutType) as any;
        if (!engine) {
          console.warn('No engine found for layout type:', layoutType);
          return;
        }
        const defaultSettings = engine.getDefaultSettings();
        const settings = {
          nodeSpacing: v1Options.nodeSpacing || defaultSettings.nodeSpacing,
          edgeSpacing: v1Options.edgeSpacing || defaultSettings.edgeSpacing,
          layerSpacing: v1Options.layerSpacing || defaultSettings.layerSpacing,
          direction: v1Options.direction || defaultSettings.direction,
          edgeRouting: v1Options.edgeRouting || defaultSettings.edgeRouting,
          alignment: v1Options.alignment || defaultSettings.alignment,
          thoroughness: v1Options.thoroughness || defaultSettings.thoroughness,
          compactComponents: v1Options.compactComponents || defaultSettings.compactComponents,
          separateComponents: v1Options.separateComponents || defaultSettings.separateComponents,
          componentSpacing: v1Options.componentSpacing || defaultSettings.componentSpacing,
          edgeNodeSpacing: v1Options.edgeNodeSpacing || defaultSettings.edgeNodeSpacing,
        };
        
        setLayoutType(layoutType);
        setLayoutSettings(settings);
        return;
      }
    }
    
    // Fallback to hierarchical layout for HSM - properly handles group nodes
    const hsmPreset = layoutManager.getPreset('hierarchical-topdown');
    if (hsmPreset) {
      setLayoutType(hsmPreset.layoutType);
      setLayoutSettings(hsmPreset.settings);
    }
  }, [exampleName, window.location.search]);

  // Handle layout changes
  const handleLayoutChange = useCallback((type: LayoutType, settings: AnyLayoutSettings) => {
    setLayoutType(type);
    setLayoutSettings(settings);
  }, []);

  if (!graphData) {
    return <div>No shape data available</div>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Layout Controls - positioned consistently */}
      <div className="absolute top-0 right-0 z-10" data-testid="layout-controls-wrapper" style={{ top: '0px', right: '0px' }}>
        <HSMLayoutControls
          layoutManager={layoutManager}
          onLayoutChange={handleLayoutChange}
          currentLayoutType={layoutType}
          currentSettings={layoutSettings}
        />
      </div>

      {/* ReactFlow Component */}
      <ReactFlowInspectorV2
        value={currentState}
        nodes={graphData.nodes}
        edges={graphData.edges}
        previousState={previousState}
        currentTransition={currentChange?.type} // Pass the exact transition type
        dispatch={dispatch}
        interactive={interactive}
      />
    </div>
  );
};
