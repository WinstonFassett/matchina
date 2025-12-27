import mermaid from "mermaid";
import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import "./mermaid.css";
// Initialize Mermaid

const useMermaid = (id: string, content: string): { svg: string | null; error: string | null } => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setSvg(null);
    setError(null);

    mermaid.render(id, content).then((svgraph) => {
      if (!isCancelled) {
        setSvg(svgraph.svg);
      }
    }).catch((err) => {
      if (!isCancelled) {
        console.error('[Mermaid] Render error:', err);
        setError(err?.message || String(err));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [id, content]);
  return { svg, error };
};

let lastId = 0;
export const Mermaid = React.memo(
  ({
    content,
    onRender,
  }: {
    content: string;
    onRender?: (el: HTMLElement) => void;
  }) => {
    const id = useMemo(() => `mermaid-${++lastId}`, []);
    const elRef = useRef<HTMLDivElement>(null);
    const { svg, error } = useMermaid(id, content);
    useEffect(() => {
      if (svg && onRender) {
        onRender?.(elRef.current!);
      }
    }, [svg]);
    if (error) return (
      <div className="mermaid-error" style={{ padding: '1rem', color: 'var(--sl-color-red)', fontSize: '0.875rem' }}>
        <strong>Mermaid Error:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{error}</pre>
      </div>
    );
    if (!svg) return <div>Loading...</div>;
    return (
      <div className="mermaid-container">
        <MemoizedInlineSvg svg={svg} ref={elRef} />
      </div>
    );
  }
);

interface InlineSvgProps {
  svg: string;
}
const InlineSvg = forwardRef<HTMLDivElement, InlineSvgProps>(({ svg }, ref) => {
  const [_dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const viewBoxMatch = svg?.match(
      /viewBox="(-?\d*\.?\d+\s+-?\d*\.?\d+\s+-?\d*\.?\d+\s+-?\d*\.?\d+)"/
    );
    if (viewBoxMatch && viewBoxMatch[1]) {
      const [, , width, height] = viewBoxMatch[1].split(/\s+/).map(Number);
      setDimensions({ width, height });
    }
  }, [svg]);

  useEffect(() => {
    // Override cluster styles after SVG is rendered
    if (containerRef.current) {
      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      const clusterRects = containerRef.current.querySelectorAll('.cluster rect, .subgraph rect');
      
      clusterRects.forEach((rect) => {
        const element = rect as SVGRectElement;
        if (isDarkMode) {
          element.style.fill = '#000000';
          element.style.stroke = 'var(--sl-color-gray-5)';
          element.style.strokeWidth = '2px';
        } else {
          element.style.fill = 'var(--sl-color-gray-1)';
          element.style.stroke = 'var(--sl-color-gray-4)';
          element.style.strokeWidth = '2px';
        }
      });
    }
  }, [svg]);

  return (
    <div
      ref={containerRef}
      style={
        {
          // minHeight: `${dimensions.height}px`,
        }
      }
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
export const MemoizedInlineSvg = React.memo(InlineSvg);

export default Mermaid;
