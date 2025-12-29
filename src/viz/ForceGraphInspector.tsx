import React, { useMemo, useRef, useEffect, useState } from "react";
import type { InspectorTheme } from './theme';
import { defaultTheme } from './theme';
import { buildShapeTree } from "../inspect/build-visualizer-tree";

interface Diagram {
  nodes: Array<{ id: string; name: string }>;
  links: Array<{ name: string; source: any; target: any }>;
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
  const mode = machine.states[state];
  return mode && mode.on && mode.on[event];
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
  console.log("ForceGraphInspector", valueFromProp, lastEvent, prevState);
  const ref = useRef<HTMLDivElement>(null);
  const graphInstance = useRef<any>(null);

  const diagram: Diagram = useMemo(() => {
    // Get shape directly from machine (like Sketch does)
    const shapeController = definition.shape;
    const shape = shapeController?.getState();
    
    if (!shape?.states) {
      return { nodes: [], links: [] };
    }
    
    // Extract states recursively (including nested)
    const extractStates = (shapeObj: any, prefix = ''): { id: string; name: string; level: number }[] => {
      const states: { id: string; name: string; level: number }[] = [];
      
      if (!shapeObj?.states) return states;
      
      // Check if this is a hierarchical machine (has nested states)
      const hasNestedStates = Object.values(shapeObj.states).some((stateConfig: any) => 
        stateConfig && typeof stateConfig === 'object' && stateConfig.states
      );
      
      if (!hasNestedStates && !prefix) {
        // Flat machine - use simple state names
        Object.keys(shapeObj.states).forEach(stateName => {
          states.push({ id: stateName, name: stateName, level: 0 });
        });
        return states;
      }
      
      Object.entries(shapeObj.states).forEach(([stateName, stateConfig]: [string, any]) => {
        const fullStateName = prefix ? `${prefix}.${stateName}` : stateName;
        const level = prefix ? prefix.split('.').length : 0;
        
        states.push({ id: fullStateName, name: fullStateName, level });
        
        // Recursively extract nested states
        if (stateConfig?.states) {
          states.push(...extractStates(stateConfig, fullStateName));
        }
      });
      
      return states;
    };
    
    // Extract transitions recursively (including nested)
    const extractTransitions = (shapeObj: any, prefix = ''): Diagram["links"] => {
      const links: Diagram["links"] = [];
      
      if (!shapeObj?.states) return links;
      
      // Check if this is a hierarchical machine (has nested states)
      const hasNestedStates = Object.values(shapeObj.states).some((stateConfig: any) => 
        stateConfig && typeof stateConfig === 'object' && stateConfig.states
      );
      
      if (!hasNestedStates && !prefix) {
        // Flat machine - use simple extraction
        Object.entries(shapeObj.states).forEach(([stateName, stateConfig]: [string, any]) => {
          if (!stateConfig?.on) return;
          
          Object.entries(stateConfig.on).forEach(([event, transitionConfig]: [string, any]) => {
            let targets: string[] = [];
            
            if (typeof transitionConfig === "string") {
              targets = [transitionConfig];
            } else if (Array.isArray(transitionConfig)) {
              targets = transitionConfig
                .map((config) => typeof config === "string" ? config : config?.target)
                .filter(Boolean);
            } else if (transitionConfig?.target) {
              targets = [transitionConfig.target];
            }
            
            targets.forEach((target) => {
              links.push({ source: stateName, target, name: event });
            });
          });
        });
        return links;
      }
      
      Object.entries(shapeObj.states).forEach(([stateName, stateConfig]: [string, any]) => {
        if (!stateConfig?.on) return;
        
        const fullStateName = prefix ? `${prefix}.${stateName}` : stateName;
        
        Object.entries(stateConfig.on).forEach(([event, transitionConfig]: [string, any]) => {
          let targets: string[] = [];
          
          if (typeof transitionConfig === "string") {
            targets = [transitionConfig];
          } else if (Array.isArray(transitionConfig)) {
            targets = transitionConfig
              .map((config) => typeof config === "string" ? config : config?.target)
              .filter(Boolean);
          } else if (transitionConfig?.target) {
            targets = [transitionConfig.target];
          }
          
          targets.forEach((target) => {
            // Handle relative targets - if target doesn't contain a dot, it's in the same level
            const fullTarget = !target.includes('.') && prefix ? `${prefix}.${target}` : target;
            links.push({ source: fullStateName, target: fullTarget, name: event });
          });
        });
        
        // Recursively extract from nested states
        if (stateConfig?.states) {
          links.push(...extractTransitions(stateConfig, fullStateName));
        }
      });
      
      return links;
    };
    
    const nodes = extractStates(shape);
    const links = extractTransitions(shape);
    
    return { nodes, links };
  }, [definition]);
  const valueRef = useRef(valueFromProp);
  valueRef.current = valueFromProp;
  // Setup ForceGraph once
  useEffect(() => {
    let mounted = true;
    let Graph: any;
    import("force-graph").then((module) => {
      if (!mounted || !ref.current) return;
      Graph = new module.default(ref.current);
      graphInstance.current = Graph;
      Graph.height(320)
        .width(320)
        .linkCurvature("curvature")
        .linkDirectionalArrowLength(6)
        .linkDirectionalArrowRelPos(1)
        .nodeCanvasObjectMode(() => "after")
        .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D) => {
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

          // Highlight active state
          const isActive = node.id === valueRef.current;
          ctx.strokeStyle =
            // isActive
            // ? getCssVar(ref, "--primary", "#1e40af")
            // :
            getCssVar(ref, "--forcegraph-node-border", "--card-border", "#222");
          ctx.lineWidth = 0.5;

          ctx.fillStyle = isActive
            ? getCssVar(ref, "--primary", "#1e40af")
            : node.color || getCssVar(ref, "--forcegraph-node-bg", "#eee");

          ctx.roundRect(
            node.x - rectWidth / 2,
            node.y - rectHeight / 2,
            rectWidth,
            rectHeight,
            6
          );
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = isActive
            ? getCssVar(ref, "--card", "#fff")
            : getCssVar(ref, "--forcegraph-label", "#222");
          ctx.fillText(label, node.x, node.y);
          ctx.restore();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition]);

  // Update graph data and highlight on value change
  useEffect(() => {
    if (graphInstance.current) {
      console.log("Updating graph data", diagram);
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

  return <div ref={ref}>{/* ForceGraph will render here */}</div>;
}
