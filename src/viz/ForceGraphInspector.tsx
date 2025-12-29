import React, { useMemo, useRef, useEffect, useState } from "react";
import { useMachine } from "../integrations/react";
import type { InspectorTheme } from './theme';
import { defaultTheme } from './theme';
import { buildShapeTree } from "../inspect/build-visualizer-tree";
import { buildForceGraphData } from './ForceGraphInspector/utils/shapeToForceGraph';

interface Diagram {
  nodes: Array<{ 
    id: string; 
    name: string;
    isGroup?: boolean;
    level?: number;
    group?: string;
    val?: number;
    color?: string;
    fullKey?: string;
  }>;
  links: Array<{ 
    name: string; 
    source: any; 
    target: any;
    type?: 'transition' | 'hierarchy';
    value?: number;
  }>;
}

function getTypedEntries(obj: any): [string, any][] {
  return Object.entries(obj) as [string, any][];
}

function getTypedMapEntries<K, V>(map: Map<K, V>): [K, V][] {
  return Array.from(map.entries());
}

function findNode(nodes: { id: string }[], id: string) {
  return nodes.find((it) => it.id === id);
}

type StateMachineDefinition = {
  states: Record<
    string,
    {
      on?: Record<string, string>;
    }
  >;
};

type ForceGraphInspectorProps = {
  value: string;
  definition: any; // FactoryMachine
  lastEvent?: string;
  prevState?: string;
  dispatch: (event: { type: string }) => void;
  interactive?: boolean;
  theme?: InspectorTheme;
};

function canFire(
  machine: StateMachineDefinition,
  state: string,
  event: string
) {
  // Handle both Map and Object formats for states
  const states = machine.states instanceof Map ? machine.states : machine.states;
  const mode = states instanceof Map ? states.get(state) : states[state];
  if (!mode || !mode.on) return false;
  
  // Handle both Map and Object formats for transitions
  const on = mode.on instanceof Map ? mode.on : mode.on;
  return on instanceof Map ? on.has(event) : !!on[event];
}

function getQuadraticXY(
  t: number,
  sx: number,
  sy: number,
  cp1x: number,
  cp1y: number,
  ex: number,
  ey: number
) {
  return {
    x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cp1x + t * t * ex,
    y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cp1y + t * t * ey,
  };
}

function getCssVar(
  ref: React.RefObject<HTMLElement | null>,
  ...namesAndFallbacks: string[]
) {
  if (!ref.current) return namesAndFallbacks[namesAndFallbacks.length - 1];
  for (let i = 0; i < namesAndFallbacks.length - 1; i++) {
    const name = namesAndFallbacks[i];
    if (!name.startsWith("--")) continue;
    const val = getComputedStyle(ref.current).getPropertyValue(name).trim();
    if (val) return val;
  }
  return namesAndFallbacks[namesAndFallbacks.length - 1];
}

export default function ForceGraphInspector({
  value: valueFromProp,
  definition,
  lastEvent,
  prevState,
  dispatch,
  interactive = true,
  theme = defaultTheme
}: ForceGraphInspectorProps) {
  const baseFontSize = 4;
  const ref = useRef<HTMLDivElement>(null);
  const graphInstance = useRef<any>(null);

  // Copy the exact working pattern from SketchInspector
  useMachine(definition);
  const currentState = definition.getState();
  
  const diagram: Diagram = useMemo(() => {
    // Handle both HSM machines (with shape) and legacy factory machines
    if (definition.shape?.getState) {
      // HSM Machine - use the new converter
      const shape = definition.shape.getState();
      
      if (!shape?.states) {
        return { nodes: [], links: [] };
      }
      
      // Use the new converter that properly handles string IDs and validation
      const graphData = buildForceGraphData(shape, { showHierarchy: true });
      
      // Convert to the old Diagram format for compatibility with existing rendering code
      // But preserve new hierarchy information for enhanced rendering
      return {
        nodes: graphData.nodes.map(node => ({
          id: node.id,
          name: node.name,
          // Pass through hierarchy info for rendering
          isGroup: node.isGroup,
          level: node.level,
          group: node.group,
          val: node.val,
          color: node.color,
          fullKey: node.fullKey
        })),
        links: graphData.links.map(link => ({
          name: link.event,
          source: link.source,  // String ID - this fixes the "node not found" error
          target: link.target,  // String ID - this fixes the "node not found" error
          // Pass through link type for different styling
          type: link.type,
          value: link.value
        }))
      };
    } else {
      // Legacy Factory Machine - convert to ForceGraph format
      const currentState = definition.getState?.();
      const transitions = definition.transitions || {};
      
      if (!currentState) {
        return { nodes: [], links: [] };
      }
      
      // Extract states from transitions
      const stateNames = new Set<string>();
      stateNames.add(currentState.key);
      
      // Add all target states from transitions
      Object.values(transitions).forEach((transitionMap: any) => {
        if (typeof transitionMap === 'object') {
          Object.values(transitionMap).forEach((targetState: any) => {
            if (typeof targetState === 'string') {
              stateNames.add(targetState);
            }
          });
        }
      });
      
      // Create nodes
      const nodes = Array.from(stateNames).map(stateName => ({
        id: stateName,
        name: stateName,
        isGroup: false,
        level: 0,
        val: stateName === currentState.key ? 15 : 10,
        color: stateName === currentState.key ? '#60a5fa' : '#8b5cf6',
        fullKey: stateName
      }));
      
      // Create links
      const links: any[] = [];
      Object.entries(transitions).forEach(([sourceState, transitionMap]: [string, any]) => {
        if (typeof transitionMap === 'object') {
          Object.entries(transitionMap).forEach(([eventName, targetState]: [string, any]) => {
            if (typeof targetState === 'string') {
              links.push({
                name: eventName,
                source: sourceState,
                target: targetState,
                type: 'transition',
                value: 1
              });
            }
          });
        }
      });
      
      return { nodes, links };
    }
  }, [definition]);
  
  // Handle value tracking using the working pattern from SketchInspector
  const currentValue = useMemo(() => {
    console.log('ForceGraph: useMemo triggered, currentState:', currentState?.key, currentState?.fullKey);
    
    if (definition.shape?.getState) {
      // HSM Machine - use current state from machine
      const result = currentState?.key || currentState?.fullKey || valueFromProp;
      console.log('ForceGraph: HSM result:', result);
      return result;
    } else {
      // Legacy Factory Machine - get current state from machine
      const result = currentState?.key || valueFromProp;
      console.log('ForceGraph: Legacy result:', result);
      return result;
    }
  }, [currentState, valueFromProp]);
  
  const valueRef = useRef(currentValue);
  valueRef.current = currentValue;
  
  // Update ForceGraph when state changes
  useEffect(() => {
    console.log('ForceGraph: useEffect triggered, currentValue:', currentValue);
    // Update the ref that node highlighting uses
    valueRef.current = currentValue;
    
    if (graphInstance.current) {
      console.log('ForceGraph: Calling graphData refresh');
      // Force a proper canvas redraw by resetting the graph data
      graphInstance.current.graphData(graphInstance.current.graphData());
      // Force canvas redraw by triggering resize
      setTimeout(() => {
        if (graphInstance.current) {
          graphInstance.current.width();
          graphInstance.current.height();
        }
      }, 10);
    } else {
      console.log('ForceGraph: No graph instance yet');
    }
  }, [currentValue]);
  
  // Setup ForceGraph once
  useEffect(() => {
    let mounted = true;
    let Graph: any;
    import("force-graph").then((module) => {
      if (!mounted || !ref.current) return;
      Graph = new module.default(ref.current);
      graphInstance.current = Graph;
      
      // Get container dimensions
      const width = ref.current.offsetWidth || 800;
      const height = ref.current.offsetHeight || 600;
      
      Graph.height(height)
        .width(width)
        .linkCurvature("curvature")
        .linkDirectionalArrowLength(6)
        .linkDirectionalArrowRelPos(1)
        .nodeCanvasObjectMode(() => "after")
        .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D) => {
          if (node.x === undefined || node.y === undefined) {
            return;
          }
          try {
            const label = node.name;
            const fontSize = baseFontSize;
            const fontFamily = getCssVar(ref, "--font-sans", "sans-serif");
            ctx.font = `${fontSize}px ${fontFamily}`;
            const textWidth = ctx.measureText(label).width;
            const paddingX = baseFontSize * 0.75;
            const paddingY = baseFontSize * 0.5;
            const rectWidth = textWidth + paddingX * 2;
            const rectHeight = fontSize + paddingY * 2;
            ctx.save();
            ctx.beginPath();

            // Highlight active state
            const isActive = node.id === valueRef.current;
            ctx.strokeStyle = getCssVar(ref, "--forcegraph-node-border", "--card-border", "#222");
            ctx.lineWidth = node.isGroup ? 2 : 0.5;  // Thicker border for groups
            
            // Different styling for group nodes
            let fillColor;
            if (isActive) {
              fillColor = getCssVar(ref, "--primary", "#1e40af");
            } else if (node.isGroup) {
              fillColor = getCssVar(ref, "--accent", "#f59e0b");  // Orange for groups
            } else {
              fillColor = node.color || getCssVar(ref, "--forcegraph-node-bg", "#8b5cf6");
            }
            
            ctx.fillStyle = fillColor;

            // Different shapes for groups vs regular nodes
            if (node.isGroup) {
              // Rounded rectangle for group nodes
              const groupPadding = paddingX * 1.5;
              const groupWidth = textWidth + groupPadding * 2;
              const groupHeight = fontSize + paddingY * 3;
              
              ctx.roundRect(
                node.x - groupWidth / 2,
                node.y - groupHeight / 2,
                groupWidth,
                groupHeight,
                8  // More rounded for groups
              );
            } else {
              // Regular rectangle for state nodes
              ctx.roundRect(
                node.x - rectWidth / 2,
                node.y - rectHeight / 2,
                rectWidth,
                rectHeight,
                6
              );
            }
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = isActive
              ? getCssVar(ref, "--card", "#fff")
              : getCssVar(ref, "--forcegraph-label", "#222");
            ctx.fillText(label, node.x, node.y);
            ctx.restore();
          } catch (e) {
            // Silently handle canvas rendering errors
          }
        })
        .nodePointerAreaPaint(
          (node: any, color: string, ctx: CanvasRenderingContext2D) => {
            const label = node.name;
            const fontSize = baseFontSize;
            const fontFamily = getCssVar(ref, "--font-sans", "sans-serif");
            ctx.font = `${fontSize}px ${fontFamily}`;
            const textWidth = ctx.measureText(label).width;
            const paddingX = baseFontSize * 0.75,
              paddingY = baseFontSize * 0.5;
            const rectWidth = textWidth + paddingX * 2;
            const rectHeight = fontSize + paddingY * 2;
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.roundRect(
              node.x - rectWidth / 2,
              node.y - rectHeight / 2,
              rectWidth,
              rectHeight,
              6
            );
            ctx.fill();
            ctx.restore();
          }
        )
        .nodeId("id")
        .nodeLabel("name")
        .nodeAutoColorBy("name")
        .linkCanvasObjectMode(() => "after")
        .linkCanvasObject((link: any, ctx: CanvasRenderingContext2D) => {
          // Draw edge label with background
          const value = valueRef.current;
          const fontSize = baseFontSize * 0.85;
          // const LABEL_NODE_MARGIN = Graph.nodeRelSize() * 2;
          const start = link.source;
          const end = link.target;
          if (typeof start !== "object" || typeof end !== "object") return;
          let textPos = {
            x: start.x + (end.x - start.x) / 2,
            y: start.y + (end.y - start.y) / 2,
          };
          if (+link.curvature > 0 && link.__controlPoints) {
            textPos = getQuadraticXY(
              0.5,
              start.x,
              start.y,
              link.__controlPoints[0],
              link.__controlPoints[1],
              end.x,
              end.y
            );
          }
          const relLink = { x: end.x - start.x, y: end.y - start.y };
          // const maxTextLength =
          //   Math.sqrt(relLink.x ** 2 + relLink.y ** 2) - LABEL_NODE_MARGIN * 2;
          let textAngle = Math.atan2(relLink.y, relLink.x);
          if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
          if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);
          const label = `${link.name}`;
          const fontFamily = getCssVar(ref, "--font-sans", "sans-serif");
          ctx.font = `${fontSize}px ${fontFamily}`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(
            (n) => n + fontSize * 0.4
          ) as [number, number];
          ctx.save();
          ctx.translate(textPos.x, textPos.y);
          ctx.rotate(textAngle);

          // Highlight possible edge
          const isPossible =
            value === link.source.name && canFire(definition, value, link.name);

          ctx.fillStyle = isPossible
            ? getCssVar(ref, "--primary", "#1e40af")
            : getCssVar(
                ref,
                "--forcegraph-edge-bg",
                "--card",
                "--color-gray-50",
                "rgba(255,255,255,0.85)"
              );
          ctx.strokeStyle = isPossible
            ? getCssVar(ref, "--primary", "#1e40af")
            : getCssVar(ref, "--forcegraph-label-border", "#ccc");
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.roundRect(
            -bckgDimensions[0] / 2,
            -bckgDimensions[1] / 2,
            ...bckgDimensions,
            5
          );
          ctx.fill();
          ctx.stroke();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = isPossible
            ? getCssVar(ref, "--card", "#fff")
            : getCssVar(ref, "--forcegraph-edge-label", "#222");
          ctx.fillText(link.name, 0, 0);
          ctx.restore();
        })
        .linkColor((link: any) => {
          const value = valueRef.current;
          
          // Hierarchy links get different styling
          if (link.type === 'hierarchy') {
            return getCssVar(
              ref,
              "--accent",
              "--forcegraph-accent",
              "#64748b"  // Muted gray for hierarchy
            );
          }
          
          // Transition links - existing logic
          if (
            value === link.source.name &&
            canFire(definition, value, link.name)
          ) {
            return getCssVar(
              ref,
              "--primary",
              "--forcegraph-primary",
              "#1e40af"
            );
          } else {
            return getCssVar(
              ref,
              "--secondary",
              "--forcegraph-secondary",
              "#4b5563"
            );
          }
        })
        .linkDirectionalParticleColor(() =>
          getCssVar(ref, "--accent", "--forcegraph-accent", "teal")
        )
        .linkDirectionalParticleSpeed(0.04)
        .linkDirectionalParticleWidth(8)
        .linkHoverPrecision(10)
        .onLinkClick(({ name }: { name: string }) => {
          if (interactive) {
            dispatch({ type: name });
          }
        })
        .onNodeClick((node: any) => {
          if (interactive) {
            // For node clicks, we could show available transitions or trigger a default action
            // For now, let's log the node click for debugging
            console.log('Node clicked:', node.id, node.name);
          }
        });
      // Increase node spacing and collision radius
      if (Graph.d3Force) {
        // const charge = Graph.d3Force("charge");
        // console.log("charge", charge.strength());
        // if (charge) charge.strength(-300); // Less negative for less huge spacing
        // if (!Graph.d3Force("collide")) {
        //   Graph.d3Force("collide", (node: any) => 18); // Smaller collision radius
        // } else {
        //   Graph.d3Force("collide").radius(18);
        // }
        // const charge = Graph.d3Force("charge");
        // if (charge) charge.strength(-100); // Default is -120, less negative = more spacing

        // Reduce link strength to weaken connections
        const linkForce = Graph.d3Force("link");
        if (linkForce) linkForce.strength(0.01); // Default is 1, lower = weaker links

        Graph.d3Force("center");
      }
      // Assign curvature for self-loops and parallel edges
      let selfLoopLinks: Record<string, any[]> = {};
      let sameNodesLinks: Record<string, any[]> = {};
      const curvatureMinMax = 0.5;
      diagram.links.forEach((link) => {
        const nodePairId =
          link.source <= link.target
            ? link.source + "_" + link.target
            : link.target + "_" + link.source;
        let map = link.source === link.target ? selfLoopLinks : sameNodesLinks;
        if (!map[nodePairId]) map[nodePairId] = [];
        map[nodePairId].push(link);
      });
      Object.keys(selfLoopLinks).forEach((id) => {
        let links = selfLoopLinks[id];
        let lastIndex = links.length - 1;
        links[lastIndex].curvature = 1;
        let delta = (1 - curvatureMinMax) / lastIndex;
        for (let i = 0; i < lastIndex; i++) {
          links[i].curvature = curvatureMinMax + i * delta;
        }
      });
      Object.keys(sameNodesLinks)
        .filter((nodePairId) => sameNodesLinks[nodePairId].length > 1)
        .forEach((nodePairId) => {
          let links = sameNodesLinks[nodePairId];
          let lastIndex = links.length - 1;
          let lastLink = links[lastIndex];
          lastLink.curvature = curvatureMinMax;
          let delta = (2 * curvatureMinMax) / lastIndex;
          for (let i = 0; i < lastIndex; i++) {
            links[i].curvature = -curvatureMinMax + i * delta;
            links[i].offset = i;
            if (lastLink.source !== links[i].source) {
              links[i].curvature *= -1;
              links[i].flipped = true;
            }
          }
        });
      Graph.graphData(diagram);
      
      // Fit view to show all nodes properly
      setTimeout(() => {
        Graph.zoomToFit(400, 50); // 400ms animation, 50px padding
      }, 100);
    });
    return () => {
      mounted = false;
      if (graphInstance.current) {
        graphInstance.current.stopAnimation();
        graphInstance.current = null;
      }
    };
  }, [definition, diagram]);

  // Update graph data and highlight on value change
  useEffect(() => {
    if (graphInstance.current) {
      graphInstance.current.graphData(diagram);
      
      // Fit view when data updates
      setTimeout(() => {
        graphInstance.current?.zoomToFit(400, 50);
      }, 100);
    }
  }, [diagram, valueFromProp]);

  // Emit particle on state change
  useEffect(() => {
    const Graph = graphInstance.current;
    if (Graph && lastEvent && prevState) {
      const link = diagram.links.find(
        (it) => it.source.id === prevState && it.name === lastEvent
      );
      if (link) {
        setTimeout(() => {
          Graph.emitParticle(link);
        }, 10);
      }
    }
  }, [lastEvent, prevState, diagram]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }}>{/* ForceGraph will render here */}</div>;
}
