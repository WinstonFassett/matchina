// Pure SVG string generator from an ELK layout.
// Mirrors the rendering logic of SvgInspector.tsx, but emits a string instead of React elements.
// Use this for build-time SSR (e.g. from Astro frontmatter) where no React runtime is needed.

import type { SvgLayout, SvgNode, SvgEdge } from './elk-layout.js';
import { buildCurvedPath, pathAtT } from './svg-path.js';

// CSS variable names with their default values (dark teal theme).
// Match SvgInspector.tsx.
const V = {
  accent: 'var(--matchina-viz-accent, #2dd4bf)',
  bg: 'var(--matchina-viz-bg, #0a0f17)',
  node: 'var(--matchina-viz-node, rgba(28,38,54,0.95))',
  nodeActive: 'var(--matchina-viz-node-active, rgba(20,90,82,0.85))',
  nodeCompound: 'var(--matchina-viz-node-compound, rgba(20,28,40,0.7))',
  border: 'var(--matchina-viz-border, rgba(148,163,184,0.25))',
  text: 'var(--matchina-viz-text, rgba(226,232,240,0.92))',
  textActive: 'var(--matchina-viz-text-active, #e6fffb)',
  edge: 'var(--matchina-viz-edge, rgba(100,116,139,0.55))',
  labelBg: 'var(--matchina-viz-label-bg, rgba(15,23,33,0.95))',
  labelBgActive: 'var(--matchina-viz-label-bg-active, rgba(8,47,51,0.95))',
  labelText: 'var(--matchina-viz-label-text, rgba(203,213,225,0.82))',
} as const;

const FONT = "var(--matchina-viz-font, 'JetBrains Mono', monospace)";

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nodeSvg(node: SvgNode, isActive: boolean, isAncestor: boolean): string {
  const stroke = isActive || isAncestor ? V.accent : V.border;
  const strokeWidth = isActive ? 2 : isAncestor ? 1.5 : 1;
  const fill = node.isCompound ? V.nodeCompound : isActive ? V.nodeActive : V.node;
  const textFill = isActive ? V.textActive : isActive || isAncestor ? V.accent : V.text;

  const rect = `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="10" ry="10" style="fill:${fill};stroke:${stroke};stroke-width:${strokeWidth}" />`;

  const label = node.isCompound
    ? `<text x="${node.x + 14}" y="${node.y + 22}" style="fill:${isActive || isAncestor ? V.accent : V.text};font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:0.06em">${esc(node.label)}</text>`
    : `<text x="${node.x + node.width / 2}" y="${node.y + node.height / 2 + 5}" text-anchor="middle" style="fill:${textFill};font-family:${FONT};font-size:14px;font-weight:${isActive ? 600 : 500}">${esc(node.label)}</text>`;

  const activeDot = isActive && !node.isCompound
    ? `<circle cx="${node.x + node.width - 10}" cy="${node.y + 10}" r="4" style="fill:${V.accent}"><animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" /></circle>`
    : '';

  return `<g data-node-id="${esc(node.id)}" data-active="${isActive}" data-ancestor="${isAncestor}">${rect}${label}${activeDot}</g>`;
}

function selfLoopSvg(edge: SvgEdge, node: SvgNode, isOutgoing: boolean, loopIndex: number): string {
  const stroke = isOutgoing ? V.accent : V.edge;
  const strokeWidth = isOutgoing ? 2 : 1.25;
  const opacity = isOutgoing ? 1 : 0.65;
  const markerId = isOutgoing ? 'matchina-svg-arrow-active' : 'matchina-svg-arrow';
  const { label } = edge;

  const hw = node.width / 2;
  const hh = node.height / 2;
  const sx = node.x + hw;
  const sy = node.y + hh;
  const loopRadius = 28 + loopIndex * 16;

  const startX = sx + hw - 8 - loopIndex * 2;
  const startY = sy - hh;
  const endX = sx + hw;
  const endY = sy - hh + 8 + loopIndex * 2;

  const d = `M ${startX} ${startY} C ${startX} ${startY - loopRadius}, ${endX + loopRadius} ${endY}, ${endX} ${endY}`;
  const labelX = sx + hw + loopRadius + 4;
  const labelY = sy - hh - 10 + loopIndex * (label ? label.height + 8 : 24);

  const path = `<path d="${d}" fill="none" style="stroke:${stroke};stroke-width:${strokeWidth};opacity:${opacity}" marker-end="url(#${markerId})" />`;

  const labelMarkup = label
    ? `<g transform="translate(${labelX}, ${labelY - label.height / 2})" style="opacity:${opacity}">
        <rect x="-6" y="-2" width="${label.width + 12}" height="${label.height + 4}" rx="6" ry="6" style="fill:${isOutgoing ? V.labelBgActive : V.labelBg};stroke:${isOutgoing ? V.accent : 'rgba(100,116,139,0.45)'};stroke-width:${isOutgoing ? 1 : 0.75}" />
        <text x="${label.width / 2}" y="${(label.height + 4) / 2 + 4}" text-anchor="middle" style="fill:${isOutgoing ? V.accent : V.labelText};font-family:${FONT};font-size:11px;font-weight:${isOutgoing ? 600 : 500};letter-spacing:0.04em">${esc(label.text)}</text>
      </g>`
    : '';

  return `<g data-edge-id="${esc(edge.id)}" data-event="${esc(edge.event)}">${path}${labelMarkup}</g>`;
}

function edgeSvg(edge: SvgEdge, isOutgoing: boolean, labelT: number): string {
  const section = edge.sections?.[0];
  if (!section?.startPoint || !section?.endPoint) return '';

  const d = buildCurvedPath(section);
  const stroke = isOutgoing ? V.accent : V.edge;
  const strokeWidth = isOutgoing ? 2 : 1.25;
  const opacity = isOutgoing ? 1 : 0.65;
  const { label } = edge;
  const markerId = isOutgoing ? 'matchina-svg-arrow-active' : 'matchina-svg-arrow';
  const mid = label ? pathAtT(section, labelT) : null;

  const path = `<path d="${d}" fill="none" style="stroke:${stroke};stroke-width:${strokeWidth};opacity:${opacity}" marker-end="url(#${markerId})" />`;

  const labelMarkup = label && mid
    ? `<g transform="translate(${mid.x - label.width / 2}, ${mid.y - label.height / 2})" style="opacity:${opacity}">
        <rect x="-6" y="-2" width="${label.width + 12}" height="${label.height + 4}" rx="6" ry="6" style="fill:${isOutgoing ? V.labelBgActive : V.labelBg};stroke:${isOutgoing ? V.accent : 'rgba(100,116,139,0.45)'};stroke-width:${isOutgoing ? 1 : 0.75}" />
        <text x="${label.width / 2}" y="${(label.height + 4) / 2 + 4}" text-anchor="middle" style="fill:${isOutgoing ? V.accent : V.labelText};font-family:${FONT};font-size:11px;font-weight:${isOutgoing ? 600 : 500};letter-spacing:0.04em">${esc(label.text)}</text>
      </g>`
    : '';

  return `<g data-edge-id="${esc(edge.id)}" data-event="${esc(edge.event)}">${path}${labelMarkup}</g>`;
}

export interface LayoutToSvgOptions {
  /** Current active state value (dot-separated full key). */
  value?: string;
  /** @deprecated No longer used; the SVG is sized to exact content dimensions. */
  padding?: number;
}

/**
 * Produce a complete SVG markup string from a precomputed ELK layout.
 * Output is sized to the layout's intrinsic dimensions plus padding,
 * with a viewBox so it scales to its container via `width="100%" height="100%"`.
 */
export function layoutToSvg(layout: SvgLayout, opts: LayoutToSvgOptions = {}): string {
  const { value = '' } = opts;
  const padding = 0;

  const activePath = value ? value.split('.') : [];
  const activeLeafId = value;

  const activeAncestorIds = new Set<string>();
  for (let i = 0; i < activePath.length - 1; i++) {
    activeAncestorIds.add(activePath.slice(0, i + 1).join('.'));
  }

  const activeSourceIds = new Set<string>();
  for (let i = 1; i <= activePath.length; i++) {
    activeSourceIds.add(activePath.slice(0, i).join('.'));
  }

  // Spread label positions for parallel edges, same heuristic as SvgInspector.
  const pairTotal = new Map<string, number>();
  for (const edge of layout.edges) {
    const key = `${edge.sourcePath.join('.')}→${edge.targetPath.join('.')}`;
    pairTotal.set(key, (pairTotal.get(key) ?? 0) + 1);
  }
  const pairNextIdx = new Map<string, number>();
  const edgeLabelT = new Map<string, number>();
  for (const edge of layout.edges) {
    const key = `${edge.sourcePath.join('.')}→${edge.targetPath.join('.')}`;
    const count = pairTotal.get(key) ?? 1;
    const idx = pairNextIdx.get(key) ?? 0;
    pairNextIdx.set(key, idx + 1);
    const t = count === 1 ? 0.5 : 0.3 + (idx / (count - 1)) * 0.4;
    edgeLabelT.set(edge.id, t);
  }

  const compounds = layout.nodes.filter((n) => n.isCompound);
  const leaves = layout.nodes.filter((n) => !n.isCompound);

  const nodeById = new Map(layout.nodes.map((n) => [n.id, n]));
  const selfLoopIndexByNode = new Map<string, number>();

  const edgeMarkup = layout.edges.map((edge) => {
    const isSelf = edge.sourcePath.join('.') === edge.targetPath.join('.');
    const isOutgoing = activeSourceIds.has(edge.sourcePath.join('.'));
    if (isSelf) {
      const nodeId = edge.sourcePath.join('.');
      const node = nodeById.get(nodeId);
      if (!node) return '';
      const loopIndex = selfLoopIndexByNode.get(nodeId) ?? 0;
      selfLoopIndexByNode.set(nodeId, loopIndex + 1);
      return selfLoopSvg(edge, node, isOutgoing, loopIndex);
    }
    return edgeSvg(edge, isOutgoing, edgeLabelT.get(edge.id) ?? 0.5);
  }).join('');

  const compoundsMarkup = compounds
    .map((n) => nodeSvg(n, n.id === activeLeafId, activeAncestorIds.has(n.id)))
    .join('');
  const leavesMarkup = leaves
    .map((n) => nodeSvg(n, n.id === activeLeafId, activeAncestorIds.has(n.id)))
    .join('');

  const vw = layout.width + padding * 2;
  const vh = layout.height + padding * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" style="display:block;background:${V.bg}">
    <defs>
      <marker id="matchina-svg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" style="fill:rgba(100,116,139,0.7)" />
      </marker>
      <marker id="matchina-svg-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" style="fill:${V.accent}" />
      </marker>
    </defs>
    <g transform="translate(${padding}, ${padding})">
      ${compoundsMarkup}
      ${edgeMarkup}
      ${leavesMarkup}
    </g>
  </svg>`;
}
