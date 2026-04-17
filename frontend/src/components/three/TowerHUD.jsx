// TowerHUD.jsx — Always-visible billboard label: Node N + status dot only
import { Html } from '@react-three/drei';
import { STATUS_COLORS } from '../../constants/theme';

export default function TowerHUD({ node }) {
  const statusColor = STATUS_COLORS[node.status] || STATUS_COLORS.normal;

  return (
    <Html
      center
      distanceFactor={8}
      position={[0, 3.8, 0]}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[100, 0]}
    >
      <div className="tower-hud">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <span
            className="status-dot"
            style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
          />
          <span className="node-id">Node {node.id}</span>
          {node.attackActive && !node.attackIntercepted && (
            <span className="attack-warn">⚠</span>
          )}
        </div>
      </div>
    </Html>
  );
}
