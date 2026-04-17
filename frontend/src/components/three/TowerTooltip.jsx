// TowerTooltip.jsx — Hover mini-panel
import { Html } from '@react-three/drei';
import { STATUS_COLORS, ATTACK_LABELS, RISK_COLORS } from '../../constants/theme';

export default function TowerTooltip({ node }) {
  const statusColor = STATUS_COLORS[node.status] || STATUS_COLORS.normal;
  const load = node.displayedLoad ?? node.currentLoad;
  const pct = ((load / node.capacity) * 100).toFixed(0);

  return (
    <Html
      position={[1.5, 2, 0]}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[110, 0]}
    >
      <div
        className="tower-tooltip"
        style={{ borderColor: statusColor, border: `1px solid ${statusColor}`, boxShadow: `0 0 15px ${statusColor}33` }}
      >
        <div className="tt-title">
          <span>⚡</span> Node {node.id}
        </div>

        <div className="tt-row">
          <span>Load</span>
          <span className="tt-value">{pct}% ({load.toFixed(1)} / {node.capacity} MW)</span>
        </div>

        <div className="tt-row">
          <span>Status</span>
          <span className="tt-value" style={{ color: statusColor }}>
            {node.status.toUpperCase()}
          </span>
        </div>

        <div className="tt-row">
          <span>Packets</span>
          <span className="tt-value">{node.packetRate}/s</span>
        </div>

        <div className="tt-row">
          <span>Risk</span>
          <span className="tt-value" style={{ color: RISK_COLORS[node.predictedRisk] || RISK_COLORS.low }}>
            {(node.predictedRisk || 'low').toUpperCase()}
          </span>
        </div>

        <div className="tt-row">
          <span>Attack</span>
          <span className="tt-value">
            {node.attackActive
              ? (node.attackIntercepted ? `${ATTACK_LABELS[node.attackType]} (BLOCKED)` : ATTACK_LABELS[node.attackType])
              : 'None'}
          </span>
        </div>
      </div>
    </Html>
  );
}
