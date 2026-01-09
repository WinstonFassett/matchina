# ELK Layout Algorithms & Settings

Source: https://eclipse.dev/elk/reference/algorithms.html

## Algorithms

- `layered` — Layer-based hierarchical (Sugiyama). Best for DAGs, flowcharts, state machines.
- `mrtree` — Traditional tree layout (Walker). Best for pure tree structures.
- `stress` — Stress-majorization force-directed. Organic, aesthetic layouts.
- `force` — Basic force-directed (Fruchterman-Reingold or Eades).
- `radial` — Radial tree layout.
- `box` — Pack nodes like boxes.

---

## `layered`

- **`elk.direction`** — DOWN | UP | RIGHT | LEFT
- **`elk.layered.spacing.nodeNodeBetweenLayers`** — layer separation (default: 20)
- **`elk.spacing.nodeNode`** — node separation within layer (default: 20)
- **`elk.hierarchyHandling`** — INCLUDE_CHILDREN | SEPARATE_CHILDREN | INHERIT
- **`elk.layered.nodePlacement.strategy`** — NETWORK_SIMPLEX | BRANDES_KOEPF | SIMPLE
- **`elk.layered.edgeRouting.strategy`** — ORTHOGONAL | POLYLINE | SPLINES
- **`elk.layered.crossingMinimization.strategy`** — LAYER_SWEEP | INTERACTIVE
- **`elk.layered.thoroughness`** — 1-20 (quality vs speed)
- **`elk.layered.cycleBreaking.strategy`** — DEPTH_FIRST | GREEDY | INTERACTIVE
- **`elk.layered.compaction.postCompaction.strategy`** — EDGE_LENGTH | LEFT | NONE
- **`elk.padding`** — [top=X,left=X,bottom=X,right=X]

---

## `mrtree`

- **`elk.direction`** — DOWN | UP | RIGHT | LEFT
- **`elk.spacing.nodeNode`** — sibling spacing (default: 20)
- **`elk.hierarchyHandling`** — INCLUDE_CHILDREN | SEPARATE_CHILDREN | INHERIT
- **`elk.mrtree.weighting`** — DESCENDANTS | LEAVES
- **`elk.mrtree.searchOrder`** — DFS | BFS
- **`elk.padding`** — [top=X,left=X,bottom=X,right=X]

---

## `stress`

- **`elk.stress.desiredEdgeLength`** — target edge length (default: 100)
- **`elk.spacing.nodeNode`** — node spacing
- **`elk.hierarchyHandling`** — INCLUDE_CHILDREN | SEPARATE_CHILDREN | INHERIT
- **`elk.stress.iterationLimit`** — max iterations (default: MAX_INT)
- **`elk.stress.epsilon`** — convergence threshold (default: 10e-4)
- **`elk.stress.fixed`** — fix node positions (default: false)
- **`elk.padding`** — [top=X,left=X,bottom=X,right=X]

---

## `force`

- **`elk.force.iterations`** — simulation steps (default: 300)
- **`elk.force.repulsion`** — repulsive force (default: 5.0)
- **`elk.spacing.nodeNode`** — node spacing
- **`elk.hierarchyHandling`** — INCLUDE_CHILDREN | SEPARATE_CHILDREN | INHERIT
- **`elk.force.temperature`** — initial temperature
- **`elk.force.model`** — FRUCHTERMAN_REINGOLD | EADES
- **`elk.padding`** — [top=X,left=X,bottom=X,right=X]

---

## Global Settings

- **`elk.algorithm`** — layered | mrtree | stress | force | radial | box
- **`elk.hierarchyHandling`** — INCLUDE_CHILDREN | SEPARATE_CHILDREN | INHERIT
- **`elk.padding`** — [top=X,left=X,bottom=X,right=X]
- **`elk.spacing.nodeNode`** — base node spacing
- **`elk.spacing.edgeNode`** — edge to node spacing
- **`elk.spacing.edgeEdge`** — edge to edge spacing
- **`elk.separateConnectedComponents`** — true | false

---

## Compound Nodes

For ELK to compute compound node size:
1. Set `children: []` on the node
2. Set `elk.hierarchyHandling: INCLUDE_CHILDREN`
3. Read `width` and `height` from the layout result
