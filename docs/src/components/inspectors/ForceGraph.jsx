import React, { useEffect, useMemo } from "react";
// import ForceGraph from 'force-graph';

function findNode(nodes, id) {
  return nodes.find((it) => it.id === id);
}

function canFire(machine, state, event) {
  // console.log({machine, state, event})
  const mode = machine.states[state];
  return mode && mode.on && mode.on[event];
}

export default function StateForceGraph({
  value,
  lastEvent,
  prevState,
  definition,
  dispatch,
}) {
  const valueLatest = React.useRef();
  const lastProps = React.useRef({ lastEvent, prevState, value });
  const prevProps = React.useRef({});
  useEffect(() => {
    prevProps.current = lastProps.current;
    lastProps.current = { lastEvent, prevState, value };
  }, [value, lastEvent, prevState]);
  useEffect(() => {
    valueLatest.current = value;
  }, [value]);
  // console.log("lastevent:", { lastEvent, prevState });
  const ref = React.useRef();
  const diagram = useMemo(() => {
    // generate list of nodes and edges with ids
    const stateIds = Object.keys(definition.states);
    const nodes = stateIds.map((key) => {
      return { name: key, id: key };
    });

    const links = [];
    stateIds.forEach((key) => {
      const state = definition.states[key];
      const source = findNode(nodes, key);
      state.on &&
        Object.keys(state.on).forEach((name) => {
          const targetId = state.on[name];
          const target = findNode(nodes, targetId); //definition.states[targetId];
          links.push({ name, source, target });
        });
    });

    return { nodes, links };
  }, [definition]);
  // console.log("diagram", diagram);
  // let Graph =

  useEffect(() => {
    let Graph;
    let isMounted = true;
    import("force-graph").then((module) => {
      if (!isMounted) return;
      console.log("imported force-graph", module);
      // console.log("ref.current", ref.current);
      Graph = new module.default(ref.current);
      console.log("Graph", Graph);
      ref.current.Graph = Graph;
      Graph.height(300)
        // .linkDirectionalParticles(1)
        .linkCurvature("curvature")
        .linkDirectionalArrowLength(6)
        .linkDirectionalArrowRelPos(1)
        .nodeCanvasObjectMode(() => "after")
        .nodeCanvasObject((node, ctx, globalScale) => {
          // if (node.name !== Graph.value) {
          //   return;
          // }
          const label = node.name;
          const fontSize = 6; /// globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle =
            node.name === lastProps.current.value ? "black" : "darkGrey"; //node.color;
          ctx.fillText(label, node.x - 2, node.y);
        })
        // edge labels
        .nodeId("id")
        .nodeLabel("name")
        .nodeAutoColorBy("name")
        .linkCanvasObjectMode(() => "after")
        .linkCanvasObject((link, ctx) => {
          // console.log({link, lastEvent})
          // console.log('link', link.curvature)
          // if (lastEvent !== link.name) {
          //   return
          // }
          const MAX_FONT_SIZE = 4;
          const LABEL_NODE_MARGIN = Graph.nodeRelSize() * 1.5;

          const start = link.source;
          const end = link.target;

          // ignore unbound links
          if (typeof start !== "object" || typeof end !== "object") return;

          // calculate label positioning
          let textPos = Object.assign(
            ...["x", "y"].map((c) => ({
              [c]: start[c] + (end[c] - start[c]) / 2, // calc middle point
            }))
          );

          if (+link.curvature > 0) {
            // console.log( 'um', { start, link, end })
            if (link.__controlPoints)
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

          // textPos.y += (link.curvature * 20)
          // textPos.x -= (link.curvature * 20)

          const relLink = { x: end.x - start.x, y: end.y - start.y };

          const maxTextLength =
            Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) -
            LABEL_NODE_MARGIN * 2;

          let textAngle = Math.atan2(relLink.y, relLink.x);
          // maintain label vertical orientation for legibility
          if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
          if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

          const label = `${link.name}`;

          // estimate fontSize to fit in link length
          ctx.font = "1px Sans-Serif";
          const fontSize = Math.min(
            MAX_FONT_SIZE,
            maxTextLength / ctx.measureText(label).width
          );
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(
            (n) => n + fontSize * 0.2
          ); // some padding

          // draw text label (with background rect)
          ctx.save();
          ctx.translate(textPos.x, textPos.y);
          // ctx.translate(
          //   // link.curvature* bckgDimensions[0]*2,
          //   0,
          //   link.curvature *  4 * bckgDimensions[1]
          //   // link.offset * bckgDimensions[1]*3
          // )
          ctx.rotate(textAngle);

          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fillRect(
            -bckgDimensions[0] / 2,
            -bckgDimensions[1] / 2,
            ...bckgDimensions
          );
          const color =
            valueLatest.current === link.source.name &&
            canFire(definition, valueLatest.current, link.name)
              ? "blue"
              : "darkgrey";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = color;
          ctx.fillText(link.name, 0, 0); // +link.curvature + (link.flipped ? '-f' : '')+link.offset, 0, 0);
          ctx.restore();
        })
        .linkColor((link) =>
          valueLatest.current === link.source.name &&
          canFire(definition, valueLatest.current, link.name)
            ? "blue"
            : lastProps.current.prevState === link.source.name &&
                lastProps.current.lastEvent &&
                lastProps.current.lastEvent.type === link.name
              ? "teal"
              : "darkgrey"
        )
        .linkDirectionalParticleColor(() => "teal")
        .linkDirectionalParticleSpeed(0.04)
        .linkDirectionalParticleWidth(8)
        .linkHoverPrecision(10)
        .onLinkClick(({ name }) => {
          dispatch({ type: name });
          // console.log("dispatched", name);
        });
      let selfLoopLinks = {};
      let sameNodesLinks = {};
      const curvatureMinMax = 0.5;

      // 1. assign each link a nodePairId that combines their source and target independent of the links direction
      // 2. group links together that share the same two nodes or are self-loops
      diagram.links.forEach((link) => {
        link.nodePairId =
          link.source <= link.target
            ? link.source + "_" + link.target
            : link.target + "_" + link.source;
        let map = link.source === link.target ? selfLoopLinks : sameNodesLinks;
        if (!map[link.nodePairId]) {
          map[link.nodePairId] = [];
        }
        map[link.nodePairId].push(link);
      });

      // Compute the curvature for self-loop links to avoid overlaps
      Object.keys(selfLoopLinks).forEach((id) => {
        let links = selfLoopLinks[id];
        let lastIndex = links.length - 1;
        links[lastIndex].curvature = 1;
        let delta = (1 - curvatureMinMax) / lastIndex;
        for (let i = 0; i < lastIndex; i++) {
          links[i].curvature = curvatureMinMax + i * delta;
        }
      });

      // Compute the curvature for links sharing the same two nodes to avoid overlaps
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
              links[i].flipped = true; // flip it around, otherwise they overlap
            }
          }
        });

      console.log("made graph", Graph);
    });
    return () => {
      // console.log("unmounting");
      if (Graph) {
        Graph.stopAnimation();
        Graph = null;
      }
    };
  }, [0]);
  useEffect(() => {
    if (!ref.current?.Graph) {
      console.warn("ForceGraph not initialized yet");
      return;
    }
    // console.log("effect", ref.current, { definition, value });
    // // const Graph = ForceGraph()(ref.current);
    // const refCurrent = ref.current;
    // console.log("refCurrent", refCurrent);
    // if (!refCurrent || !refCurrent.Graph) {
    //   console.warn("ForceGraph not initialized yet");
    //   return;
    // }
    // const { Graph } = ref.current;
    // Graph.value = value;
    console.log("setting graphData", diagram);
    ref.current.Graph.graphData(diagram);
    // if (Graph) {
    // }
  }, [diagram, value]);

  useEffect(() => {
    // console.log("lastEvent", lastEvent);
    if (!lastEvent) return;
    const { links } = diagram;
    if (prevState) {
      // console.log("event", prevState, lastEvent);
      const { type } = lastEvent;
      const link = diagram.links.find(
        (it) => it.source.id === prevState && it.name === type
      );
      // console.log("link", link, links);
      setTimeout(() => {
        Graph?.emitParticle(link);
        // console.log("emitted", link);
      }, 10);
    }
    // if (ref.current && ref.current.Graph) {
    // [...Array(10).keys()].forEach(() => {
    //   const link = links[Math.floor(Math.random() * links.length)];
    //   ref.current.Graph.emitParticle(link);
    // });
    // }
  }, [lastEvent]);
  return (
    <>
      {/* Debug: {JSON.stringify({ prevState, lastEvent })} */}
      <div ref={ref}>Coming soon: StateForceGraph</div>
    </>
  );
}

function getQuadraticXY(t, sx, sy, cp1x, cp1y, ex, ey) {
  return {
    x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cp1x + t * t * ex,
    y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cp1y + t * t * ey,
  };
}
