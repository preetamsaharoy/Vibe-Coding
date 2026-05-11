import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Maximize2, RotateCcw } from 'lucide-react';
import { SQLGraph } from '../services/sqlService';

interface SQLVisualizerProps {
  graph: SQLGraph;
}

const SQLVisualizer: React.FC<SQLVisualizerProps> = ({ graph }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graph) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Main container for zoom/pan
    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<any>(graph.nodes)
      .force("link", d3.forceLink<any, any>(graph.links).id(d => d.id).distance(180))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(100));

    // Arrow marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#94a3b8")
      .style("stroke", "none");

    const link = g.append("g")
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    const linkLabels = g.append("g")
      .selectAll("text")
      .data(graph.links)
      .enter().append("text")
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .text(d => d.label);

    const node = g.append("g")
      .selectAll("g")
      .data(graph.nodes)
      .enter().append("g")
      .style("cursor", "grab")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("rect")
      .attr("width", 140)
      .attr("height", d => 45 + (d.columns?.length || 0) * 18)
      .attr("x", -70)
      .attr("y", d => -22.5 - (d.columns?.length || 0) * 9)
      .attr("rx", 10)
      .attr("fill", d => {
        if (d.type === 'result') return '#fef3c7';
        if (d.type === 'subquery') return '#f1f5f9';
        return '#ffffff';
      })
      .attr("stroke", d => {
        if (d.type === 'result') return '#f59e0b';
        if (d.type === 'subquery') return '#94a3b8';
        return '#3b82f6';
      })
      .attr("stroke-width", 2)
      .attr("class", "shadow-sm");

    node.append("text")
      .attr("dy", d => -8 - (d.columns?.length || 0) * 9)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "13px")
      .attr("fill", "#1e293b")
      .text(d => d.label);

    node.each(function(d) {
      if (d.columns) {
        const nodeG = d3.select(this);
        d.columns.forEach((col, i) => {
          nodeG.append("text")
            .attr("dy", (d.columns?.length || 0) * -9 + 18 + i * 18)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("fill", "#64748b")
            .text(col);
        });
      }
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabels
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 8);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
      d3.select(this).style("cursor", "grabbing");
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
      d3.select(this).style("cursor", "grab");
    }

    // Initial zoom to fit
    const resetZoom = () => {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(0, 0).scale(1)
      );
    };

    // Expose reset to window for the button
    (window as any).resetSQLZoom = resetZoom;

    return () => {
      simulation.stop();
    };
  }, [graph]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-100 shadow-sm">
        <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3 mr-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tables</span>
          <div className="w-3 h-3 rounded-full bg-slate-400 ml-2"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subqueries</span>
          <div className="w-3 h-3 rounded-full bg-amber-500 ml-2"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Result</span>
        </div>
        <button 
          onClick={() => (window as any).resetSQLZoom?.()}
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors flex items-center gap-1"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Reset</span>
        </button>
      </div>
      
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-100 shadow-sm text-[10px] text-slate-400 font-medium">
          Scroll to zoom • Drag to pan
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-move" />
    </div>
  );
};

export default SQLVisualizer;
