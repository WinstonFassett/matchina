import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MachineShape } from 'matchina';
import { runElkLayout } from './elk-layout.js';
import type { ElkLayoutOptions, SvgEdge, SvgLayout, SvgNode } from './elk-layout.js';
import { buildCurvedPath, pathMidpoint } from './svg-path.js';

// CSS variable names with their default values (dark teal theme).
// Consumers can override any of these on a parent element.
//
//   --matchina-viz-accent          active highlight color
//   --matchina-viz-bg              canvas background
//   --matchina-viz-node            leaf node fill
//   --matchina-viz-node-active     active leaf fill
//   --matchina-viz-node-compound   compound node fill
//   --matchina-viz-border          inactive node border
//   --matchina-viz-text            label text
//   --matchina-viz-text-active     active label text
//   --matchina-viz-edge            inactive edge stroke

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
  ctrlBg: 'var(--matchina-viz-ctrl-bg, rgba(20,28,40,0.85))',
  ctrlBorder: 'var(--matchina-viz-ctrl-border, rgba(148,163,184,0.24))',
  ctrlText: 'var(--matchina-viz-ctrl-text, rgba(226,232,240,0.65))',
} as const;

function NodeShape({ node, isActive, isAncestor }: {
  node: SvgNode;
  isActive: boolean;
  isAncestor: boolean;
}) {
  const stroke = isActive || isAncestor ? V.accent : V.border;
  const strokeWidth = isActive ? 2 : isAncestor ? 1.5 : 1;
  const fill = node.isCompound
    ? V.nodeCompound
    : isActive
    ? V.nodeActive
    : V.node;
  const textFill = isActive ? V.textActive : isActive || isAncestor ? V.accent : V.text;

  return (
    <g>
      <rect
        x={node.x} y={node.y}
        width={node.width} height={node.height}
        rx={10} ry={10}
        style={{ fill, stroke, strokeWidth, transition: 'stroke 280ms ease, fill 280ms ease' }}
      />
      {node.isCompound ? (
        <text
          x={node.x + 14} y={node.y + 22}
          style={{
            fill: isActive || isAncestor ? V.accent : V.text,
            fontFamily: "var(--matchina-viz-font, 'JetBrains Mono', monospace)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            transition: 'fill 280ms ease',
          }}
        >
          {node.label}
        </text>
      ) : (
        <text
          x={node.x + node.width / 2} y={node.y + node.height / 2 + 5}
          textAnchor="middle"
          style={{
            fill: textFill,
            fontFamily: "var(--matchina-viz-font, 'JetBrains Mono', monospace)",
            fontSize: 14,
            fontWeight: isActive ? 600 : 500,
            transition: 'fill 280ms ease',
          }}
        >
          {node.label}
        </text>
      )}
      {isActive && !node.isCompound && (
        <circle cx={node.x + node.width - 10} cy={node.y + 10} r={4} style={{ fill: V.accent }}>
          <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

function EdgeShape({ edge, isOutgoing, onFire }: {
  edge: SvgEdge;
  isOutgoing: boolean;
  onFire: (event: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const section = edge.sections?.[0];
  if (!section?.startPoint || !section?.endPoint) return null;

  const d = buildCurvedPath(section);
  const stroke = isOutgoing ? V.accent : V.edge;
  const strokeWidth = isOutgoing ? (hovered ? 2.5 : 2) : 1.25;
  const opacity = isOutgoing ? 1 : 0.65;
  const { label } = edge;
  const markerId = isOutgoing ? 'matchina-svg-arrow-active' : 'matchina-svg-arrow';

  // Compute path midpoint for label centering — ELK's label placement can drift
  // off the visual center of routed edges, so we override with the actual midpoint.
  const mid = label ? pathMidpoint(section) : null;

  return (
    <g
      style={{ cursor: isOutgoing ? 'pointer' : 'default' }}
      onClick={isOutgoing ? () => onFire(edge.event) : undefined}
      onMouseEnter={isOutgoing ? () => setHovered(true) : undefined}
      onMouseLeave={isOutgoing ? () => setHovered(false) : undefined}
    >
      {isOutgoing && (
        <path d={d} fill="none" stroke="transparent" strokeWidth={18} />
      )}
      <path
        d={d} fill="none"
        style={{
          stroke, strokeWidth, opacity,
          transition: 'stroke 220ms ease, opacity 220ms ease',
        }}
        markerEnd={`url(#${markerId})`}
      />
      {label && mid && (
        <g
          transform={`translate(${mid.x - label.width / 2}, ${mid.y - label.height / 2})`}
          style={{ opacity, transition: 'opacity 220ms ease', cursor: isOutgoing ? 'pointer' : 'default' }}
          onClick={isOutgoing ? () => onFire(edge.event) : undefined}
        >
          <rect
            x={-6} y={-2}
            width={label.width + 12} height={label.height + 4}
            rx={6} ry={6}
            style={{
              fill: isOutgoing
                ? hovered ? V.accent : V.labelBgActive
                : V.labelBg,
              stroke: isOutgoing ? V.accent : 'rgba(100,116,139,0.45)',
              strokeWidth: isOutgoing ? 1 : 0.75,
              transition: 'fill 150ms ease, stroke 150ms ease',
            }}
          />
          <text
            x={label.width / 2} y={(label.height + 4) / 2 + 4}
            textAnchor="middle"
            style={{
              fill: isOutgoing
                ? hovered ? V.labelBg : V.accent
                : V.labelText,
              fontFamily: "var(--matchina-viz-font, 'JetBrains Mono', monospace)",
              fontSize: 11,
              fontWeight: isOutgoing ? 600 : 500,
              letterSpacing: '0.04em',
              userSelect: 'none',
              transition: 'fill 150ms ease',
            }}
          >
            {label.text}
          </text>
        </g>
      )}
    </g>
  );
}

const ctrlBtn: React.CSSProperties = {
  background: V.ctrlBg,
  border: `1px solid ${V.ctrlBorder}`,
  color: V.ctrlText,
  padding: '5px 11px',
  borderRadius: 6,
  fontFamily: "var(--matchina-viz-font, 'JetBrains Mono', monospace)",
  fontSize: 11,
  cursor: 'pointer',
};

export interface SvgInspectorProps {
  shape: MachineShape;
  value: string;
  onFire?: (event: string) => void;
  options?: ElkLayoutOptions;
  interactive?: boolean;
}

const FIT_PADDING = 32;
const MAX_FIT_ZOOM = 1.0;

function computeFit(
  contentW: number,
  contentH: number,
  containerW: number,
  containerH: number,
): { zoom: number; pan: { x: number; y: number } } {
  const scaleX = (containerW - FIT_PADDING * 2) / contentW;
  const scaleY = (containerH - FIT_PADDING * 2) / contentH;
  const zoom = Math.min(scaleX, scaleY, MAX_FIT_ZOOM);
  const pan = {
    x: (containerW - contentW * zoom) / 2,
    y: (containerH - contentH * zoom) / 2,
  };
  return { zoom, pan };
}

export const SvgInspector = React.memo(function SvgInspector({
  shape,
  value,
  onFire,
  options,
  interactive = true,
}: SvgInspectorProps) {
  const [layout, setLayout] = useState<SvgLayout | null>(null);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable options key — re-layout only when options actually change
  const optionsKey = JSON.stringify(options ?? {});

  useEffect(() => {
    runElkLayout(shape, options ?? {}).then(setLayout).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, optionsKey]);

  function fitToContainer(l: SvgLayout) {
    const el = containerRef.current;
    if (!el) return;
    const { zoom: z, pan: p } = computeFit(l.width, l.height, el.clientWidth, el.clientHeight);
    setZoom(z);
    setPan(p);
  }

  // Auto-fit whenever a new layout arrives
  useEffect(() => {
    if (layout) fitToContainer(layout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // Derive active paths from the current state value (dot-separated fullKey)
  const activePath = useMemo(() => (value ? value.split('.') : []), [value]);

  const activeLeafId = value;
  const activeAncestorIds = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < activePath.length - 1; i++) {
      set.add(activePath.slice(0, i + 1).join('.'));
    }
    return set;
  }, [activePath]);

  // Outgoing edges: source is on the active path (leaf or any ancestor)
  const activeSourceIds = useMemo(() => {
    const set = new Set<string>();
    for (let i = 1; i <= activePath.length; i++) {
      set.add(activePath.slice(0, i).join('.'));
    }
    return set;
  }, [activePath]);

  function handleFire(event: string) {
    if (interactive) onFire?.(event);
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => Math.min(2.5, Math.max(0.3, z * (e.deltaY > 0 ? 0.92 : 1.08))));
  }

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current.active) return;
    setPan({
      x: dragRef.current.px + e.clientX - dragRef.current.sx,
      y: dragRef.current.py + e.clientY - dragRef.current.sy,
    });
  }
  function onMouseUp() { dragRef.current.active = false; }

  if (!layout) {
    return (
      <div style={{ width: '100%', height: '100%', background: V.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: V.edge, fontFamily: "var(--matchina-viz-font, 'JetBrains Mono', monospace)", fontSize: 12 }}>computing layout…</span>
      </div>
    );
  }

  const { nodes, edges, width, height } = layout;
  const compounds = nodes.filter(n => n.isCompound);
  const leaves = nodes.filter(n => !n.isCompound);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'grab',
        background: V.bg,
        backgroundImage: `radial-gradient(ellipse 80% 60% at 70% 0%, color-mix(in srgb, ${V.accent} 5%, transparent), transparent 60%)`,
      }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <svg
        width="100%" height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="matchina-svg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: 'rgba(100,116,139,0.7)' }} />
          </marker>
          <marker id="matchina-svg-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: V.accent }} />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Compound containers rendered first (lowest z) */}
          {compounds.map(node => (
            <NodeShape
              key={node.id}
              node={node}
              isActive={node.id === activeLeafId}
              isAncestor={activeAncestorIds.has(node.id)}
            />
          ))}
          {/* Edges */}
          {edges.map(edge => (
            <EdgeShape
              key={edge.id}
              edge={edge}
              isOutgoing={activeSourceIds.has(edge.sourcePath.join('.'))}
              onFire={handleFire}
            />
          ))}
          {/* Leaves on top */}
          {leaves.map(node => (
            <NodeShape
              key={node.id}
              node={node}
              isActive={node.id === activeLeafId}
              isAncestor={activeAncestorIds.has(node.id)}
            />
          ))}
        </g>
      </svg>

      <div style={{
        position: 'absolute', bottom: 14, right: 14,
        display: 'flex', gap: 4,
        background: V.ctrlBg,
        border: `1px solid ${V.ctrlBorder}`,
        padding: 4, borderRadius: 8,
      }}>
        <button onClick={() => layout && fitToContainer(layout)} style={ctrlBtn}>Fit</button>
        <button onClick={() => setZoom(z => Math.min(2.5, z * 1.15))} style={ctrlBtn}>+</button>
        <button onClick={() => setZoom(z => Math.max(0.3, z * 0.87))} style={ctrlBtn}>−</button>
        <span style={{
          fontFamily: "var(--matchina-viz-font, 'JetBrains Mono', monospace)",
          color: V.ctrlText,
          padding: '0 6px', fontSize: 11, lineHeight: '28px',
        }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
});

export default SvgInspector;
