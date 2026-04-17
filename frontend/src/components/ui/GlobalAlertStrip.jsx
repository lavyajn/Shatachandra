// GlobalAlertStrip.jsx — Top alert banner with dynamic messages
import { useState, useEffect, useRef } from 'react';
import useGridStore from '../../store/useGridStore';

export default function GlobalAlertStrip() {
  const nodes = useGridStore((s) => s.nodes);
  const connectionStatus = useGridStore((s) => s.connectionStatus);
  const [alerts, setAlerts] = useState([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const prevNodeStates = useRef({});

  useEffect(() => {
    const newAlerts = [];

    // Check connection status
    if (connectionStatus === 'disconnected') {
      newAlerts.push({ type: 'attack', message: 'Connection lost — Reconnecting...', priority: 10 });
    }

    // Check for nodes under threat (derived from status)
    const threatenedNodes = nodes.filter(n => n.status === 'high' || n.status === 'compromised');
    threatenedNodes.forEach(n => {
      const trustStr = (n.trust ?? 100).toFixed(0);
      newAlerts.push({
        type: 'attack',
        message: `THREAT DETECTED: Node ${n.id} — Trust: ${trustStr}% — Status: ${n.status.toUpperCase()}`,
        priority: 8,
      });
    });

    // Check for isolated nodes
    const isolatedNodes = nodes.filter(n => n.status === 'isolated');
    isolatedNodes.forEach(n => {
      newAlerts.push({
        type: 'critical',
        message: `Node ${n.id} ISOLATED — Load redistributed`,
        priority: 7,
      });
    });

    // Check for critical predictions
    const criticalNodes = nodes.filter(n => n.predictedRisk === 'critical' && n.status !== 'high' && n.status !== 'compromised');
    criticalNodes.forEach(n => {
      newAlerts.push({
        type: 'critical',
        message: `CRITICAL PREDICTION: Node ${n.id} failure in ${n.timeToFailure?.toFixed(1) || '?'}s`,
        priority: 6,
      });
    });

    // Check for recently recovered nodes
    nodes.forEach(n => {
      const prevStatus = prevNodeStates.current[n.id];
      if (prevStatus === 'compromised' && n.status === 'normal') {
        newAlerts.push({
          type: 'recovered',
          message: `Node ${n.id} stabilized — Trust restored`,
          priority: 4,
        });
      }
    });

    // Update prev states
    const stateMap = {};
    nodes.forEach(n => { stateMap[n.id] = n.status; });
    prevNodeStates.current = stateMap;

    if (newAlerts.length > 0) {
      // Sort by priority descending
      newAlerts.sort((a, b) => b.priority - a.priority);
      setAlerts(newAlerts);
    } else {
      setAlerts([{
        type: 'normal',
        message: `System Normal — ${nodes.filter(n => n.status !== 'isolated').length} Nodes Online`,
        priority: 0,
      }]);
    }
  }, [nodes, connectionStatus]);

  // Cycle alerts every 4 seconds
  useEffect(() => {
    if (alerts.length <= 1) {
      setCurrentAlertIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentAlertIndex(prev => (prev + 1) % alerts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [alerts]);

  const currentAlert = alerts[currentAlertIndex] || alerts[0];
  if (!currentAlert) return null;

  const isAttack = currentAlert.type === 'attack';

  return (
    <div className={`alert-strip ${currentAlert.type}`}>
      {isAttack ? (
        <span className="marquee-text">{currentAlert.message}</span>
      ) : (
        <span>{currentAlert.message}</span>
      )}
      {alerts.length > 1 && (
        <span style={{
          position: 'absolute',
          right: 12,
          fontSize: 9,
          color: 'inherit',
          opacity: 0.6,
        }}>
          {currentAlertIndex + 1}/{alerts.length}
        </span>
      )}
    </div>
  );
}
