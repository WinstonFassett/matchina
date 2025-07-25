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

function findNode(nodes: { id: string }[], id: string) {
  return nodes.find((it) => it.id === id);
}

function canFire(
  machine: StateMachineDefinition,
  state: string,
  event: string,
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
  ey: number,
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
      Graph.height(300)
        .width(300)
        .linkCurvature("curvature")
        .linkDirectionalArrowLength(6)
        .linkDirectionalArrowRelPos(1)
        .nodeCanvasObjectMode(() => "after")
        .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D) => {
          const label = node.name;
          const fontSize = 6;
          const value = valueRef.current;
          const fontFamily = getCssVar(ref, "--font-sans", "sans-serif");
          const activeColor = getCssVar(
            ref,
            "--primary",
            "--forcegraph-primary",
            "--color-accent-700",
            "#1e40af",
          );
          console.log("activeColor", activeColor);
          const inactiveColor = getCssVar(
            ref,
            "--secondary",
            "--forcegraph-secondary",
            "--color-gray-700",
            "#374151",
          );
          ctx.font = `${fontSize}px ${fontFamily}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = node.name === value ? activeColor : inactiveColor;
          ctx.fillText(label, node.x - 2, node.y);
        })
        .nodeId("id")
        .nodeLabel("name")
        .nodeAutoColorBy("name")
        .linkCanvasObjectMode(() => "after")
        .linkCanvasObject((link: any, ctx: CanvasRenderingContext2D) => {
          const value = valueRef.current;
          const MAX_FONT_SIZE = 4;
          const LABEL_NODE_MARGIN = Graph.nodeRelSize() * 1.5;
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
              end.y,
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
          ctx.font = `1px ${fontFamily}`;
          const fontSize = Math.min(
            MAX_FONT_SIZE,
            maxTextLength / ctx.measureText(label).width,
          );
          ctx.font = `${fontSize}px ${fontFamily}`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(
            (n) => n + fontSize * 0.2,
          ) as [number, number];
          ctx.save();
          ctx.translate(textPos.x, textPos.y);
          ctx.rotate(textAngle);
          // Use forcegraph-bg, then card, then fallback
          const bgColor = getCssVar(
            ref,
            "--forcegraph-bg",
            "--card",
            "--color-gray-50",
            "rgba(255,255,255,0.7)",
          );
          ctx.fillStyle = bgColor;
          ctx.fillRect(
            -bckgDimensions[0] / 2,
            -bckgDimensions[1] / 2,
            ...bckgDimensions,
          );
          const activeColor = getCssVar(
            ref,
            "--primary",
            "--forcegraph-primary",
            "--color-accent-700",
            "#1e40af",
          );
          const inactiveColor = getCssVar(
            ref,
            "--secondary",
            "--forcegraph-secondary",
            "--color-gray-600",
            "#4b5563",
          );
          const color =
            value === link.source.name && canFire(definition, value, link.name)
              ? activeColor
              : inactiveColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = color;
          ctx.fillText(link.name, 0, 0);
          ctx.restore();
        })
        .linkColor((link: any) => {
          const value = valueRef.current;
          const activeColor = getCssVar(
            ref,
            "--primary",
            "--forcegraph-primary",
            "--color-accent-700",
            "#1e40af",
          );
          const inactiveColor = getCssVar(
            ref,
            "--secondary",
            "--forcegraph-secondary",
            "--color-gray-600",
            "#4b5563",
          );
          return value === link.source.name &&
            canFire(definition, value, link.name)
            ? activeColor
            : inactiveColor;
        })
        .linkDirectionalParticleColor(() =>
          getCssVar(
            ref,
            "--accent",
            "--forcegraph-accent",
            "--color-accent-400",
            "teal",
          ),
        )
        .linkDirectionalParticleSpeed(0.04)
        .linkDirectionalParticleWidth(8)
        .linkHoverPrecision(10)
        .onLinkClick(({ name }: { name: string }) => {
          dispatch({ type: name });
        });
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
        (it) => it.source.id === prevState && it.name === lastEvent,
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
