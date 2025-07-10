import mermaid from 'mermaid';
import React, { forwardRef, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import './mermaid.css';
// Initialize Mermaid

const useMermaid = (id: string, content: string): string | null => {
  const [svg, setSvg] = useState<string | null>(null);
  
  useEffect(() => {
    let isCancelled = false;

    mermaid.mermaidAPI.render(id, content).then(svgraph => {
      if (!isCancelled) {
        setSvg(svgraph.svg);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [id, content]);
  return svg;
};

interface MermaidProps {
  content: string;
}


let lastId = 0
export const Mermaid = React.memo(({ content, onRender }: { content: string, onRender?: (el: HTMLElement) => void }) => {
  const id = useMemo(() => `mermaid-${++lastId}`, [])
  const elRef = useRef<HTMLDivElement>(null);
  const svg = useMermaid(id, content);
  useEffect(() => {
    if (svg && onRender) {
      onRender?.(elRef.current!);
    }
  }, [svg])
  if (!svg) return <div>Loading...</div>;
  return <div>
    <InlineSvg svg={svg} ref={elRef} />    
  </div>
})

interface InlineSvgProps {
  svg: string;
}

const InlineSvg: React.FC<InlineSvgProps> = React.memo(forwardRef(({ svg }, ref) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const viewBoxMatch = svg?.match(/viewBox="(-?\d*\.?\d+\s+-?\d*\.?\d+\s+-?\d*\.?\d+\s+-?\d*\.?\d+)"/);
    if (viewBoxMatch && viewBoxMatch[1]) {
      const [, , width, height] = viewBoxMatch[1].split(/\s+/).map(Number);
      setDimensions({ width, height });
    }
  }, [svg]);
  return <div 
    ref={ref as RefObject<HTMLDivElement> | null}
    style={{
      
      minHeight: `${dimensions.height}px`,
    }}
    dangerouslySetInnerHTML={{ __html: svg }} />;
}));

export default Mermaid;


