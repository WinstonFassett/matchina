import React, { useEffect } from 'react';
import {
  getBezierPath,
  useInternalNode,
  useStore,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type ReactFlowState,
} from '@xyflow/react';
import { getEdgeParams } from './floating-utils';

// Add CSS animation for exact-transition dashed edges
const addDashAnimation = () => {
  if (typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes dash { to { stroke-dashoffset: -10; } }`;
  if (!document.head.querySelector('style[data-floating-edge-animation]')) {
    style.setAttribute('data-floating-edge-animation', 'true');
    document.head.appendChild(style);
  }
};

interface FloatingEdgeData extends Record<string, unknown> {
  event?: string;
  isClickable?: boolean;
  isActive?: boolean;
  isExactTransition?: boolean;
  isDashed?: boolean;
}

export default function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  label,
  style,
  data,
}: EdgeProps<any>) {
  useEffect(() => { addDashAnimation(); }, []);

  const sourceNode = useInternalNode(source as string);
  const targetNode = useInternalNode(target as string);

  if (!sourceNode || !targetNode) {
    console.warn('FloatingEdge: Missing nodes', { id, source, target });
    return null;
  }

  const sourcePos = sourceNode.internals.positionAbsolute;
  const targetPos = targetNode.internals.positionAbsolute;

  if (Number.isNaN(sourcePos.x) || Number.isNaN(targetPos.x)) {
    console.error('FloatingEdge NaN coordinates:', { id, source, target });
  }

  let sx: number, sy: number, tx: number, ty: number, sPos: any, tPos: any;

  if (source === target) {
    const measured = sourceNode.measured || { width: 100, height: 40 };
    const px = Number.isNaN(sourcePos.x) ? 0 : sourcePos.x;
    const py = Number.isNaN(sourcePos.y) ? 0 : sourcePos.y;
    sx = px + (measured.width || 100) / 2;
    sy = py + (measured.height || 40) / 2;
    tx = sx; ty = sy;
    sPos = 'right'; tPos = 'left';
  } else {
    const params = getEdgeParams(sourceNode, targetNode);
    sx = params.sx; sy = params.sy; tx = params.tx; ty = params.ty;
    sPos = params.sourcePos; tPos = params.targetPos;
  }

  const edgeInfo = useStore((s: ReactFlowState) => {
    const allBidirectional = s.edges.filter(
      (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source)
    );
    const sameDirection = allBidirectional.filter((e) => e.source === source && e.target === target);
    return {
      edgeIndex: sameDirection.findIndex((e) => e.id === id),
      isMultiEdge: allBidirectional.length > 1,
      totalBidirectional: allBidirectional.length,
    };
  });

  const { isMultiEdge, totalBidirectional } = edgeInfo;

  let edgePath: string;
  let labelX: number, labelY: number;

  if (source === target) {
    const selfLoopIndex = useStore((s: ReactFlowState) => {
      const loops = s.edges.filter((e) => e.source === source && e.target === target);
      return loops.findIndex((e) => e.id === id);
    });

    const measured = sourceNode.measured || { width: 100, height: 40 };
    const hw = (measured.width!) / 2;
    const hh = (measured.height!) / 2;
    const loopRadius = 28 + selfLoopIndex * 16;

    const startX = sx + hw - 8 - selfLoopIndex * 2;
    const startY = sy - hh;
    const endX = sx + hw;
    const endY = sy - hh + 8 + selfLoopIndex * 2;

    edgePath = `M ${startX} ${startY} C ${startX} ${startY - loopRadius}, ${endX + loopRadius} ${endY}, ${endX} ${endY}`;
    labelX = sx + hw + loopRadius + 20;
    labelY = sy - hh - 10 + selfLoopIndex * 16;
  } else {
    const [path] = getBezierPath({ sourceX: sx, sourceY: sy, sourcePosition: sPos, targetPosition: tPos, targetX: tx, targetY: ty });

    if (isMultiEdge) {
      const dx = tx - sx;
      const dy = ty - sy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance === 0) {
        edgePath = path;
        labelX = sx; labelY = sy;
      } else {
        const perpX = -dy / distance;
        const perpY = dx / distance;
        const angle = Math.abs(Math.atan2(dy, dx));
        const verticalFactor = angle <= Math.PI / 2 ? angle / (Math.PI / 2) : (Math.PI - angle) / (Math.PI / 2);
        const spacing = 40 + (120 - 40) * verticalFactor;
        const maxOffset = ((totalBidirectional - 1) * spacing) / 2;

        const globalIndex = useStore((s: ReactFlowState) => {
          const all = s.edges.filter(
            (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source)
          );
          const same = all.filter((e) => e.source === source && e.target === target);
          const opp = all.filter((e) => e.source === target && e.target === source);
          if (same.some((e) => e.id === id)) return same.findIndex((e) => e.id === id);
          return same.length + opp.findIndex((e) => e.id === id);
        });

        const offset = globalIndex * spacing - maxOffset;
        const midX = (sx + tx) / 2 + perpX * offset;
        const midY = (sy + ty) / 2 + perpY * offset;
        const t = 0.5;
        edgePath = `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`;
        labelX = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * midX + t * t * tx;
        labelY = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * ty;
      }
    } else {
      edgePath = path;
      labelX = (sx + tx) / 2;
      labelY = (sy + ty) / 2;
    }
  }

  const isClickable = data?.isClickable;
  const isActive = data?.isActive;
  const isExactTransition = data?.isExactTransition;
  const isDashed = data?.isDashed;

  const edgeStyle: React.CSSProperties = {
    ...(style as React.CSSProperties || {}),
    stroke: (style as React.CSSProperties)?.stroke || 'var(--matchina-viz-edge, rgba(100,116,139,0.5))',
    strokeWidth: (style as React.CSSProperties)?.strokeWidth || 1.5,
    strokeDasharray: isDashed ? '6,4' : (style as React.CSSProperties)?.strokeDasharray,
    opacity: (style as React.CSSProperties)?.opacity,
    cursor: (style as React.CSSProperties)?.cursor,
    ...(isExactTransition && { animation: 'dash 1s linear infinite' }),
  };

  const labelColor = isExactTransition
    ? 'var(--matchina-viz-accent, #8fb9d6)'
    : isActive
    ? 'var(--matchina-viz-node-active, #8fb9d6)'
    : 'var(--matchina-viz-label-text, rgba(203,213,225,0.85))';

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {label && (
        <EdgeLabelRenderer>
          <span
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: '11px',
              fontFamily: 'var(--matchina-viz-font, "JetBrains Mono", monospace)',
              fontWeight: isActive ? 600 : 500,
              color: isActive
                ? 'var(--matchina-viz-bg, #0a0f17)'
                : isExactTransition
                ? 'var(--matchina-viz-accent, #8fb9d6)'
                : 'var(--matchina-viz-label-text, rgba(203,213,225,0.85))',
              background: isActive
                ? 'var(--matchina-viz-accent, #8fb9d6)'
                : isExactTransition
                ? 'transparent'
                : 'var(--matchina-viz-label-bg-pill, rgba(15,23,33,0.82))',
              border: isActive
                ? '1px solid var(--matchina-viz-accent, #8fb9d6)'
                : isExactTransition
                ? '1px solid var(--matchina-viz-accent, #8fb9d6)'
                : '1px solid rgba(100,116,139,0.45)',
              borderRadius: '6px',
              padding: '2px 7px',
              pointerEvents: isClickable ? 'all' : 'none',
              cursor: isClickable ? 'pointer' : 'default',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              zIndex: isActive ? 1000 : 100,
              letterSpacing: '0.04em',
              lineHeight: 1.4,
            }}
            className="nodrag nopan"
          >
            {label}
          </span>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
