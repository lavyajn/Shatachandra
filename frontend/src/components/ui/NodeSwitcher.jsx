// NodeSwitcher.jsx — Button row to switch between nodes in SCADA
import useGridStore from '../../store/useGridStore';

export default function NodeSwitcher() {
  const nodes = useGridStore((s) => s.nodes);
  const selectedNodeId = useGridStore((s) => s.selectedNodeId);
  const navigateToScada = useGridStore((s) => s.navigateToScada);

  return (
    <div className="node-switcher">
      {nodes.map(n => (
        <button
          key={n.id}
          className={`node-btn ${n.id === selectedNodeId ? 'active' : ''}`}
          onClick={() => navigateToScada(n.id)}
          title={`Node ${n.id}`}
        >
          {n.id}
        </button>
      ))}
    </div>
  );
}
