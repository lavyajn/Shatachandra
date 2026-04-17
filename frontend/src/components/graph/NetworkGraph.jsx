// NetworkGraph.jsx — 2D Force Graph View
import { useRef, useCallback, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import useGridStore from '../../store/useGridStore';
import { STATUS_COLORS, RISK_COLORS } from '../../constants/theme';

export default function NetworkGraph() {
  const graphRef = useRef();
  const nodes = useGridStore((s) => s.nodes);
  const edges = useGridStore((s) => s.edges);
  const selectNode = useGridStore((s) => s.selectNode);

  const graphData = useMemo(() => {
    const gNodes = nodes.map(n => ({
      id: n.id,
      label: n.id,
      fullLabel: n.label,
      load: n.currentLoad,
      capacity: n.capacity,
      status: n.status,
      attackActive: n.attackActive,
      attackType: n.attackType,
      predictedRisk: n.predictedRisk,
      packetRate: n.packetRate,
      displayedLoad: n.displayedLoad ?? n.currentLoad,
      x: n.position2D.x,
      y: n.position2D.y,
      fx: n.position2D.x,
      fy: n.position2D.y,
      val: 6,
    }));

    const gLinks = edges.map(e => ({
      source: e.source,
      target: e.target,
      flow: e.currentFlow,
      baseCapacity: e.baseCapacity,
      stressed: e.stressed,
      id: e.id,
    }));

    return { nodes: gNodes, links: gLinks };
  }, [nodes, edges]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const statusColor = STATUS_COLORS[node.status] || STATUS_COLORS.normal;
    const loadRatio = node.load / node.capacity;
    const radius = 16;

    // Outer ring for attack or high risk
    if (node.attackActive) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (node.predictedRisk === 'critical' || node.predictedRisk === 'high') {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Glow
    const gradient = ctx.createRadialGradient(node.x, node.y, radius * 0.5, node.x, node.y, radius * 2);
    gradient.addColorStop(0, statusColor + '40');
    gradient.addColorStop(1, statusColor + '00');
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius * 2, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = statusColor + '30';
    ctx.fill();
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Load arc (partial fill showing load percentage)
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius - 3, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * Math.min(loadRatio, 1)));
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center text — node ID
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(node.id, node.x, node.y - 2);

    // Load value below
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${node.load.toFixed(0)}MW`, node.x, node.y + 10);

    // Packet rate
    ctx.fillText(`${node.packetRate}/s`, node.x, node.y + 22);

    // Attack warning icon above
    if (node.attackActive) {
      ctx.font = '14px sans-serif';
      ctx.fillText('⚠', node.x, node.y - radius - 10);
    }
  }, []);

  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    const source = link.source;
    const target = link.target;
    if (!source.x || !target.x) return;

    const flowRatio = link.flow / link.baseCapacity;
    const width = Math.max(1, 1 + flowRatio * 4);
    const color = link.stressed ? '#ff4400' : '#0088ff';

    // Main line
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = color + '80';
    ctx.lineWidth = width;
    ctx.stroke();

    // Moving particle
    const t = (Date.now() / (2000 / (flowRatio + 0.5))) % 1;
    const px = source.x + (target.x - source.x) * t;
    const py = source.y + (target.y - source.y) * t;

    ctx.beginPath();
    ctx.arc(px, py, 3, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  const handleNodeClick = useCallback((node) => {
    selectNode(node.id);
  }, [selectNode]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0e1a' }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={handleNodeClick}
        nodeRelSize={6}
        enableNodeDrag={false}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.4}
        cooldownTime={100}
        backgroundColor="rgba(10,14,26,1)"
        linkDirectionalParticles={0}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
      />
    </div>
  );
}
