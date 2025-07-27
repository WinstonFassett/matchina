import React, { useEffect, useRef, useMemo } from "react";

type StateMachineDefinition = {
  states: Record<
    string,
    {
      on?: Record<string, string>;
    }
  >;
};

type Diagram = {
  nodes: { id: string; name: string }[];
  links: {
    name: string;
    source: any;
    target: any;
    [key: string]: any;
  }[];
};

type Change = {
  type: string;
  from: string;
  to: string;
};

type ForceGraphInspectorProps = {
  value: string;
  definition: StateMachineDefinition;
  lastEvent?: string;
  prevState?: string;
  dispatch: (event: { type: string }) => void;
};

// Utility: Detect dark mode
function isDarkMode(ref: React.RefObject<HTMLElement | null>) {
  if (!ref.current) return false;
  return (
    getComputedStyle(ref.current)
      .getPropertyValue("color-scheme")
      .includes("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function findNode(nodes: { id: string }[], id: string) {
  return nodes.find((it) => it.id === id);
}

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
}: ForceGraphInspectorProps) {
  const baseFontSize = 4;
  console.log("ForceGraphInspector", valueFromProp, lastEvent, prevState);
  const ref = useRef<HTMLDivElement>(null);
  const graphInstance = useRef<any>(null);

  const diagram: Diagram = useMemo(() => {
    const stateIds = Object.keys(definition.states);
    const nodes = stateIds.map((key) => ({ id: key, name: key }));
    const links: Diagram["links"] = [];
    stateIds.forEach((key) => {
      const state = definition.states[key];
      const source = findNode(nodes, key);
      state.on &&
        Object.keys(state.on).forEach((name) => {
          const targetId = state.on![name];
          const target = findNode(nodes, targetId);
          links.push({ name, source, target });
        });
    });
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
          const LABEL_NODE_MARGIN = Graph.nodeRelSize() * 2;
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
          const maxTextLength =
            Math.sqrt(relLink.x ** 2 + relLink.y ** 2) - LABEL_NODE_MARGIN * 2;
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
          dispatch({ type: name });
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
        const charge = Graph.d3Force("charge");
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
        link.nodePairId =
          link.source <= link.target
            ? link.source + "_" + link.target
            : link.target + "_" + link.source;
        let map = link.source === link.target ? selfLoopLinks : sameNodesLinks;
        if (!map[link.nodePairId]) map[link.nodePairId] = [];
        map[link.nodePairId].push(link);
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
