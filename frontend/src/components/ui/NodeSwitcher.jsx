// NodeSwitcher.jsx — Button row to switch between nodes in SCADA
import useGridStore from '../../store/useGridStore';

export default function NodeSwitcher() {
  const nodes = useGridStore((s) => s.nodes);
  const selectedNodeId = useGridStore((s) => s.selectedNodeId);
  const selectNode = useGridStore((s) => s.selectNode);

  return (
    <div className="node-switcher">
      {nodes.map(n => (
        <button
          key={n.id}
          className={`node-btn ${n.id === selectedNodeId ? 'active' : ''}`}
          onClick={() => selectNode(n.id)}
          title={n.label}
        >
          {n.id}
        </button>
      ))}
    </div>
  );
}
