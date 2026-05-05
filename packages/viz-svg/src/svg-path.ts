// SVG path utilities for curved edge rendering.
// Produces quadratic bézier rounded corners at each bend point.

interface Point {
  x: number;
  y: number;
}

export function buildCurvedPath(
  section: {
    startPoint: Point;
    endPoint: Point;
    bendPoints?: Point[];
  },
  radius = 14,
): string {
  const pts = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint];
  if (pts.length <= 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const next = pts[i + 1];
    const v1x = cur.x - prev.x;
    const v1y = cur.y - prev.y;
    const v2x = next.x - cur.x;
    const v2y = next.y - cur.y;
    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;
    const r = Math.min(radius, len1 / 2, len2 / 2);
    const p1 = { x: cur.x - (v1x / len1) * r, y: cur.y - (v1y / len1) * r };
    const p2 = { x: cur.x + (v2x / len2) * r, y: cur.y + (v2y / len2) * r };
    d += ` L ${p1.x} ${p1.y} Q ${cur.x} ${cur.y} ${p2.x} ${p2.y}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}
