import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid once globally with clean dark monochrome styling
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      darkMode: true,
      background: '#0d0d0d',
      primaryColor: '#1c1c1f',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#38383a',
      lineColor: '#8e8e93',
      secondaryColor: '#18181b',
      tertiaryColor: '#09090b',
      edgeLabelBackground: '#141416',
      nodeBorder: '#3f3f46',
      clusterBkg: '#121214',
      clusterBorder: '#27272a',
      defaultLinkColor: '#a1a1aa',
      titleColor: '#ffffff'
    },
    fontFamily: 'Space Grotesk, ui-sans-serif, system-ui, sans-serif',
    securityLevel: 'loose'
  });
}

let chartCounter = 0;

interface MermaidChartProps {
  chart: string;
  className?: string;
  id?: string;
}

export const MermaidChart: React.FC<MermaidChartProps> = ({ chart, className = '', id = 'diagram' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const chartId = `mermaid-${id}-${Date.now()}-${++chartCounter}`;

    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(chartId, chart);
        
        // Remove temporary element that Mermaid may inject in document.body
        const tempEl = document.getElementById(`d${chartId}`);
        if (tempEl) tempEl.remove();

        if (isMounted) {
          setSvgContent(svg);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Mermaid render error for chart:', chart, err);
        const tempEl = document.getElementById(`d${chartId}`);
        if (tempEl) tempEl.remove();

        if (isMounted) {
          setError(err?.message || 'Failed to render diagram');
          setIsLoading(false);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
      const tempEl = document.getElementById(`d${chartId}`);
      if (tempEl) tempEl.remove();
    };
  }, [chart, id]);

  return (
    <div className={`w-full overflow-x-auto min-h-[300px] flex items-center justify-center ${className}`}>
      {isLoading && !svgContent ? (
        <div className="flex items-center gap-2 font-mono text-xs text-[#888888] py-12">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          <span>Rendering Architecture Diagram...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded border border-rose-900/40 bg-rose-950/20 text-rose-300 font-mono text-xs max-w-lg">
          <span className="font-bold block mb-1">Diagram Render Warning</span>
          <span>{error}</span>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="w-full flex justify-center items-center py-4 [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};
