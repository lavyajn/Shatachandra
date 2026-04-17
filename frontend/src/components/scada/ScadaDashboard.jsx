// ScadaDashboard.jsx — Full SCADA panel overlay for selected node
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
  const selectNode = useGridStore((s) => s.selectNode);

  if (!selectedNodeId) return null;

  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  return (
    <div className="scada-overlay">
      {/* Top Bar */}
      <div className="scada-topbar">
        <div className="scada-title">
          <span>⚡</span>
          <span>SCADA: {node.label}</span>
          <span className={`status-badge ${node.status}`} style={{ marginLeft: 8 }}>
            {node.status.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NodeSwitcher />
          <button
            className="btn"
            style={{ padding: '4px 10px', fontSize: 16, lineHeight: 1 }}
            onClick={() => selectNode(null)}
            title="Close SCADA Dashboard"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Grid Layout: 3 columns × 3 rows */}
      <div className="scada-grid">
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
