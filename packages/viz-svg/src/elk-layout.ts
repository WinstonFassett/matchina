// ELK layout adapter for MachineShape.
// Uses LCA-based edge placement (edges live in their lowest common ancestor container).
// Returns flat arrays with absolute positions — no ReactFlow dependency.

import ELKConstructor from 'elkjs/lib/elk.bundled.js';
import type { MachineShape } from 'matchina';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const elk = new (ELKConstructor as any)();

export interface SvgNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  isCompound: boolean;
  path: string[];
}

export interface SvgEdge {
  id: string;
  event: string;
  sourcePath: string[];
  targetPath: string[];
  sections: {
    startPoint: { x: number; y: number };
    endPoint: { x: number; y: number };
    bendPoints?: { x: number; y: number }[];
  }[];
  label: { text: string; x: number; y: number; width: number; height: number } | null;
}

export interface SvgLayout {
  nodes: SvgNode[];
  edges: SvgEdge[];
  width: number;
  height: number;
}

export interface ElkLayoutOptions {
  direction?: 'RIGHT' | 'DOWN';
  edgeRouting?: 'ORTHOGONAL' | 'POLYLINE';
  nodeSpacing?: number;
  layerSpacing?: number;
}

// ELK parses dots in node IDs as "nodeId.portId", so sanitize them.
function toElkId(fullKey: string): string { return fullKey.replace(/\./g, '|'); }
function fromElkId(id: string): string { return id.replace(/\|/g, '.'); }

function textWidth(text: string, charW = 7.2, pad = 24): number {
  return Math.max(60, Math.ceil(text.length * charW) + pad);
}

function lcaPath(a: string[], b: string[]): string[] {
  const out: string[] = [];
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) out.push(a[i]);
    else break;
  }
  return out;
}

type ElkNodeDraft = {
  id: string;
  labels: { text: string; width: number; height: number }[];
  layoutOptions: Record<string, string | undefined>;
  width?: number;
  height?: number;
  children?: ElkNodeDraft[];
  edges?: ElkEdgeDraft[];
  _meta: { path: string[]; isCompound: boolean };
};

type ElkEdgeDraft = {
  id: string;
  sources: string[];
  targets: string[];
  labels: { text: string; width: number; height: number }[];
  _meta: { event: string; sourcePath: string[]; targetPath: string[] };
};

function buildElkNode(
  fullKey: string,
  shape: MachineShape,
  nodeSpacing: number,
  layerSpacing: number,
  direction: string,
): ElkNodeDraft {
  const stateNode = shape.states.get(fullKey)!;
  const label = stateNode.key;
  const isCompound = stateNode.isCompound;
  const path = fullKey.split('.');

  const node: ElkNodeDraft = {
    id: toElkId(fullKey),
    labels: [{ text: label, width: textWidth(label, 7.5, 16), height: 18 }],
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
      'elk.spacing.nodeNode': String(nodeSpacing),
      'elk.spacing.edgeNode': String(nodeSpacing * 0.5),
      'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
      'elk.layered.considerModelOrder': 'NODES_AND_EDGES',
    },
    _meta: { path, isCompound },
  };

  if (!isCompound) {
    node.width = Math.max(textWidth(label, 8, 32), 92);
    node.height = 44;
  } else {
    node.layoutOptions['elk.hierarchyHandling'] = 'INCLUDE_CHILDREN';
    node.layoutOptions['elk.padding'] =
      `[top=36,left=${nodeSpacing * 0.6},bottom=${nodeSpacing * 0.6},right=${nodeSpacing * 0.6}]`;

    // Find children via hierarchy map
    const children: string[] = [];
    for (const [childKey, parentKey] of shape.hierarchy) {
      if (parentKey === fullKey) children.push(childKey);
    }
    node.children = children.map(childKey =>
      buildElkNode(childKey, shape, nodeSpacing, layerSpacing, direction),
    );
  }

  return node;
}

function indexNodes(node: ElkNodeDraft, byId: Map<string, ElkNodeDraft>): void {
  byId.set(node.id, node);
  for (const child of node.children ?? []) indexNodes(child, byId);
}

export async function runElkLayout(
  shape: MachineShape,
  opts: ElkLayoutOptions = {},
): Promise<SvgLayout> {
  const nodeSpacing = opts.nodeSpacing ?? 40;
  const layerSpacing = opts.layerSpacing ?? nodeSpacing + 20;
  const direction = opts.direction ?? 'RIGHT';
  const edgeRouting = opts.edgeRouting ?? 'ORTHOGONAL';

  // Root states: those without a parent
  const rootKeys: string[] = [];
  for (const [fullKey, parentKey] of shape.hierarchy) {
    if (parentKey === undefined) rootKeys.push(fullKey);
  }

  const rootChildren = rootKeys.map(key =>
    buildElkNode(key, shape, nodeSpacing, layerSpacing, direction),
  );

  // Build id → node index for LCA edge assignment
  const byId = new Map<string, ElkNodeDraft>();
  for (const child of rootChildren) indexNodes(child, byId);

  // Assign edges to their LCA container
  const rootEdges: ElkEdgeDraft[] = [];
  for (const [sourceFullKey, eventMap] of shape.transitions) {
    for (const [event, targetFullKey] of eventMap) {
      if (!shape.states.has(targetFullKey)) continue;
      if (!byId.has(toElkId(sourceFullKey)) || !byId.has(toElkId(targetFullKey))) continue;

      const sourcePath = sourceFullKey.split('.');
      const targetPath = targetFullKey.split('.');
      const edge: ElkEdgeDraft = {
        id: `e:${toElkId(sourceFullKey)}->${toElkId(targetFullKey)}:${event}`,
        sources: [toElkId(sourceFullKey)],
        targets: [toElkId(targetFullKey)],
        labels: [{ text: event, width: textWidth(event, 6.6, 14), height: 16 }],
        _meta: { event, sourcePath, targetPath },
      };

      const lca = lcaPath(sourcePath, targetPath);
      const lcaKey = lca.join('.');
      const owner = lcaKey ? byId.get(toElkId(lcaKey)) : null;
      if (owner?.children) {
        owner.edges = owner.edges ?? [];
        owner.edges.push(edge);
      } else {
        rootEdges.push(edge);
      }
    }
  }

  const elkInput = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.edgeRouting': edgeRouting,
      'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
      'elk.spacing.nodeNode': String(nodeSpacing),
      'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
      'elk.layered.considerModelOrder': 'NODES_AND_EDGES',
      'elk.padding': `[top=${nodeSpacing * 0.6},left=${nodeSpacing * 0.6},bottom=${nodeSpacing * 0.6},right=${nodeSpacing * 0.6}]`,
    },
    children: rootChildren,
    edges: rootEdges,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await elk.layout(elkInput as any) as any;

  // Flatten tree → absolute-positioned arrays
  const nodes: SvgNode[] = [];
  const edges: SvgEdge[] = [];
  const absById = new Map<string, { x: number; y: number }>();
  absById.set('root', { x: 0, y: 0 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walkNodes(node: any, ox: number, oy: number): void {
    const ax = (node.x ?? 0) + ox;
    const ay = (node.y ?? 0) + oy;
    absById.set(node.id, { x: ax, y: ay });

    if (node.id !== 'root' && node._meta) {
      nodes.push({
        id: fromElkId(node.id),
        x: ax,
        y: ay,
        width: node.width ?? 92,
        height: node.height ?? 44,
        label: node.labels?.[0]?.text ?? node.id,
        isCompound: node._meta.isCompound,
        path: node._meta.path,
      });
    }
    for (const child of (node.children ?? []) as typeof node[]) walkNodes(child, ax, ay);
  }
  walkNodes(result, 0, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walkEdges(node: any): void {
    for (const edge of node.edges ?? []) {
      const containerId: string = edge.container ?? node.id ?? 'root';
      const off = absById.get(containerId) ?? { x: 0, y: 0 };
      const label = edge.labels?.[0];
      edges.push({
        id: edge.id,
        event: edge._meta?.event ?? '',
        sourcePath: edge._meta?.sourcePath ?? [],
        targetPath: edge._meta?.targetPath ?? [],
        sections: (edge.sections ?? []).map((s: any) => ({
          startPoint: { x: s.startPoint.x + off.x, y: s.startPoint.y + off.y },
          endPoint: { x: s.endPoint.x + off.x, y: s.endPoint.y + off.y },
          bendPoints: (s.bendPoints ?? []).map((b: any) => ({ x: b.x + off.x, y: b.y + off.y })),
        })),
        label: label
          ? {
              text: label.text,
              x: (label.x ?? 0) + off.x,
              y: (label.y ?? 0) + off.y,
              width: label.width ?? 60,
              height: label.height ?? 16,
            }
          : null,
      });
    }
    for (const child of node.children ?? []) walkEdges(child);
  }
  walkEdges(result);

  return {
    nodes,
    edges,
    width: result.width ?? 800,
    height: result.height ?? 600,
  };
}
