// ScadaDashboard.jsx — Dedicated SCADA view (full-panel, not overlay)
import useGridStore from '../../store/useGridStore';
import NodeSwitcher from '../ui/NodeSwitcher';
import GridStatusPanel from './GridStatusPanel';
import CommunicationPanel from './CommunicationPanel';
import AttackDetailsPanel from './AttackDetailsPanel';
import PredictionPanel from './PredictionPanel';
import SystemResponsePanel from './SystemResponsePanel';
import DecisionBox from './DecisionBox';
import LoadGraph from './LoadGraph';
import PacketGraph from './PacketGraph';

export default function ScadaDashboard() {
  const selectedNodeId = useGridStore((s) => s.selectedNodeId);
  const nodes = useGridStore((s) => s.nodes);
  const navigateToMain = useGridStore((s) => s.navigateToMain);

  if (!selectedNodeId) return null;

  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  return (
    <div className="scada-view">
      {/* ─── Top Bar ─── */}
      <div className="scada-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Back Navigation — top-left, clearly labelled */}
          <button
            className="back-nav"
            onClick={navigateToMain}
          >
            ← Main Grid
          </button>

          <div className="scada-title">
            <span style={{ color: '#ffcc00' }}>⚡</span>
            <span>SCADA: Node {node.id}</span>
            <span style={{
              marginLeft: '8px', fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
              background: node.status === 'compromised' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 255, 204, 0.1)',
              color: node.status === 'compromised' ? '#ff3333' : '#00ffcc',
              border: `1px solid ${node.status === 'compromised' ? 'rgba(239,68,68,0.3)' : 'rgba(0,255,204,0.2)'}`,
              letterSpacing: '0.08em',
            }}>
              {node.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NodeSwitcher />
        </div>
      </div>

      {/* ─── Grid Layout ─── */}
      <div className="scada-grid" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {/* Row 1 */}
        <GridStatusPanel node={node} />
        <CommunicationPanel node={node} />
        <AttackDetailsPanel node={node} />

        {/* Row 2 */}
        <PredictionPanel node={node} />
        <SystemResponsePanel node={node} />
        <DecisionBox node={node} />

        {/* Row 3 */}
        <LoadGraph node={node} />
        <PacketGraph node={node} />
      </div>
    </div>
  );
}