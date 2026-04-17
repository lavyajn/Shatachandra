// TowerHUD.jsx — Always-visible billboard label above each tower
import { Html } from '@react-three/drei';
import { STATUS_COLORS } from '../../constants/theme';

export default function TowerHUD({ node }) {
  const statusColor = STATUS_COLORS[node.status] || STATUS_COLORS.normal;
  const load = node.displayedLoad ?? node.currentLoad;

  return (
    <Html
      center
      distanceFactor={8}
      position={[0, 3.8, 0]}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[100, 0]}
    >
      <div className="tower-hud">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <span
            className="status-dot"
            style={{ backgroundColor: statusColor }}
          />
          <span className="node-id">{node.id}</span>
          {node.attackActive && (
            <span className="attack-warn">⚠</span>
          )}
        </div>
        <div className="hud-stat">
          <span>{load.toFixed(1)}</span> MW
        </div>
        <div className="hud-stat">
          <span>{node.packetRate}</span>/s
        </div>
      </div>
    </Html>
  );
}
