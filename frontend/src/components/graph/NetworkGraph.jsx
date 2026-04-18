// NetworkGraph.jsx — 2D Force Graph View with auto-centering + shield/attack indicators
// CRITICAL FIX: Robust auto-centering that properly frames all 6 towers on 3D→2D toggle
import { useRef, useCallback, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import useGridStore from '../../store/useGridStore';
import { STATUS_COLORS, RISK_COLORS } from '../../constants/theme';

export default function NetworkGraph() {
  const graphRef = useRef();
  const nodes = useGridStore((s) => s.nodes);
  const edges = useGridStore((s) => s.edges);
  const navigateToScada = useGridStore((s) => s.navigateToScada);
  const containerRef = useRef();
  const hasCentered = useRef(false);
  const animFrameRef = useRef(null);

  const graphData = useMemo(() => {
    const gNodes = nodes.map(n => ({
      id: n.id,
      label: `Node ${n.id}`,
      load: n.currentLoad,
      capacity: n.capacity,
      status: n.status,
      attackActive: n.attackActive,
      attackIntercepted: n.attackIntercepted,
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

  // CRITICAL FIX: Robust auto-centering using zoomToFit with retries
  // Ensures 2D canvas is centered in viewport with all 6 towers visible
  useEffect(() => {
    if (!graphRef.current || nodes.length === 0) return;

    // Reset centering flag when component mounts (view toggle)
    hasCentered.current = false;

    // Progressive centering: try multiple times with increasing delays
    // to handle canvas not being fully laid out yet
    const centerGraph = () => {
      if (!graphRef.current) return;
      try {
        graphRef.current.zoomToFit(600, 80);
        hasCentered.current = true;
      } catch (e) {
        // Silently retry
      }
    };

    // Immediate attempt
    const t1 = setTimeout(centerGraph, 100);
    // Retry after layout
    const t2 = setTimeout(centerGraph, 400);
    // Final attempt
    const t3 = setTimeout(centerGraph, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [nodes.length]);

  // Re-center on window resize
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current && nodes.length > 0) {
        graphRef.current.zoomToFit(400, 80);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [nodes.length]);

  // Force continuous repainting for animations (shield pulse, attack glitch)
  useEffect(() => {
    const animate = () => {
      if (graphRef.current) {
        // Trigger a repaint by nudging the graph engine
        graphRef.current.d3ReheatSimulation && graphRef.current.d3ReheatSimulation();
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    // Repaint every ~100ms for smooth animations
    const interval = setInterval(() => {
      if (graphRef.current) {
        // Force canvas redraw
        graphRef.current.d3ReheatSimulation && graphRef.current.d3ReheatSimulation();
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const statusColor = STATUS_COLORS[node.status] || STATUS_COLORS.normal;
    const loadRatio = node.load / node.capacity;
    const radius = 16;
    const time = Date.now() / 1000;

    // Aegis Shield indicator — cyan circle for defended towers
    if (node.attackIntercepted) {
      const shieldRadius = radius + 10;
      const shieldPulse = 0.6 + 0.4 * Math.sin(time * 2);

      // Outer cyan glow
      const shieldGradient = ctx.createRadialGradient(
        node.x, node.y, shieldRadius * 0.7,
        node.x, node.y, shieldRadius * 1.5
      );
      shieldGradient.addColorStop(0, `rgba(0, 217, 255, ${0.12 * shieldPulse})`);
      shieldGradient.addColorStop(1, 'rgba(0, 217, 255, 0)');
      ctx.beginPath();
      ctx.arc(node.x, node.y, shieldRadius * 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = shieldGradient;
      ctx.fill();

      // Shield ring — dashed cyan circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, shieldRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(0, 217, 255, ${0.6 * shieldPulse})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner shield ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, shieldRadius - 3, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(0, 153, 204, ${0.3 * shieldPulse})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hexagonal grid pattern overlay
      const hexSegments = 6;
      for (let i = 0; i < hexSegments; i++) {
        const angle = (i / hexSegments) * Math.PI * 2 + time * 0.3;
        const nextAngle = ((i + 1) / hexSegments) * Math.PI * 2 + time * 0.3;
        ctx.beginPath();
        ctx.moveTo(
          node.x + Math.cos(angle) * (shieldRadius - 1),
          node.y + Math.sin(angle) * (shieldRadius - 1)
        );
        ctx.lineTo(
          node.x + Math.cos(nextAngle) * (shieldRadius - 1),
          node.y + Math.sin(nextAngle) * (shieldRadius - 1)
        );
        ctx.strokeStyle = `rgba(0, 217, 255, ${0.25 * shieldPulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // "AEGIS" label
      ctx.font = 'bold 6px Michroma, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(0, 217, 255, ${0.7 * shieldPulse})`;
      ctx.fillText('AEGIS', node.x, node.y + shieldRadius + 10);
    }

    // Target Acquisition Box indicator — red square for attacked towers
    if (node.attackActive && !node.attackIntercepted) {
      const boxSize = radius + 10;
      const glitchX = (Math.random() - 0.5) * 1.5;
      const glitchY = (Math.random() - 0.5) * 1.5;
      const attackPulse = 0.6 + 0.4 * Math.sin(time * 5);

      // Red glow background
      const attackGradient = ctx.createRadialGradient(
        node.x, node.y, boxSize * 0.5,
        node.x, node.y, boxSize * 1.8
      );
      attackGradient.addColorStop(0, `rgba(255, 0, 0, ${0.08 * attackPulse})`);
      attackGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(node.x, node.y, boxSize * 1.8, 0, 2 * Math.PI);
      ctx.fillStyle = attackGradient;
      ctx.fill();

      // Red wireframe square with glitch offset
      ctx.strokeStyle = `rgba(255, 51, 51, ${0.8 * attackPulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        node.x - boxSize + glitchX,
        node.y - boxSize + glitchY,
        boxSize * 2,
        boxSize * 2
      );

      // Corner brackets
      const bracketLen = 8;
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.9})`;
      ctx.lineWidth = 2.5;
      const corners = [
        [node.x - boxSize, node.y - boxSize],
        [node.x + boxSize, node.y - boxSize],
        [node.x + boxSize, node.y + boxSize],
        [node.x - boxSize, node.y + boxSize],
      ];
      const dirs = [
        [[1, 0], [0, 1]],
        [[-1, 0], [0, 1]],
        [[-1, 0], [0, -1]],
        [[1, 0], [0, -1]],
      ];
      corners.forEach(([cx, cy], i) => {
        const [[dx1, dy1], [dx2, dy2]] = dirs[i];
        ctx.beginPath();
        ctx.moveTo(cx + dx1 * bracketLen, cy + dy1 * bracketLen);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dx2 * bracketLen, cy + dy2 * bracketLen);
        ctx.stroke();
      });

      // Scan lines across the box
      const scanY = node.y - boxSize + ((time * 40) % (boxSize * 2));
      ctx.beginPath();
      ctx.moveTo(node.x - boxSize, scanY);
      ctx.lineTo(node.x + boxSize, scanY);
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 * attackPulse})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // "BREACH" text above
      ctx.font = 'bold 7px Michroma, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255, 51, 51, ${attackPulse})`;
      ctx.fillText('BREACH', node.x, node.y - boxSize - 6);
    }

    // Outer ring for high risk (only when not already showing attack/shield)
    if (!node.attackActive && (node.predictedRisk === 'critical' || node.predictedRisk === 'high')) {
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

    // Tower icon — small triangle at center
    ctx.beginPath();
    ctx.moveTo(node.x, node.y - 5);
    ctx.lineTo(node.x - 4, node.y + 3);
    ctx.lineTo(node.x + 4, node.y + 3);
    ctx.closePath();
    ctx.fillStyle = statusColor + '80';
    ctx.fill();

    // Center text — Node N label
    ctx.font = '10px Michroma, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`T${parseInt(node.id) + 1}`, node.x, node.y - 2);

    // Load value below
    ctx.font = '8px Michroma, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${node.load.toFixed(0)}MW`, node.x, node.y + 10);

    // Attack warning icon above
    if (node.attackActive && !node.attackIntercepted) {
      ctx.font = '14px sans-serif';
      ctx.fillText('⚠', node.x, node.y - radius - 18);
    }
  }, []);

  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    const source = link.source;
    const target = link.target;
    if (!source.x || !target.x) return;

    const flowRatio = link.flow / link.baseCapacity;
    const width = Math.max(1, 1 + flowRatio * 4);
    const color = link.stressed ? '#ff4400' : '#0088ff';
    const time = Date.now() / 1000;

    // Glow effect behind main line
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = color + '20';
    ctx.lineWidth = width + 4;
    ctx.stroke();

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

    // Second particle (offset)
    const t2 = ((Date.now() + 1000) / (2000 / (flowRatio + 0.5))) % 1;
    const px2 = source.x + (target.x - source.x) * t2;
    const py2 = source.y + (target.y - source.y) * t2;

    ctx.beginPath();
    ctx.arc(px2, py2, 2, 0, 2 * Math.PI);
    ctx.fillStyle = color + 'AA';
    ctx.fill();
  }, []);

  const handleNodeClick = useCallback((node) => {
    navigateToScada(node.id);
  }, [navigateToScada]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#060912' }}>
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
        backgroundColor="rgba(6,9,18,1)"
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
