// DecisionBox.jsx — C++ Defense Engine decision display
import useGridStore from '../../store/useGridStore';

export default function DecisionBox({ node }) {
  const decisionLog = useGridStore((s) => s.decisionLog);
  const perNodeDecisions = node.decisionLog || [];

  // Parse global decision log into display entries
  const displayEntries = [];

  if (perNodeDecisions.length > 0) {
    displayEntries.push(...perNodeDecisions.slice(-3));
  }

  // If global decision log mentions this node, include it
  const nodeIdNum = parseInt(node.id, 10);
  if (decisionLog && decisionLog.includes(`Node ${nodeIdNum}`)) {
    displayEntries.unshift(`→ ${decisionLog}`);
  }

  // Trim to last 4 entries
  const recentDecisions = displayEntries.slice(-4);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title">🧠 Decision Engine</div>

      <div className="decision-box" style={{ flex: 1 }}>
        {recentDecisions.length === 0 ? (
          <div style={{ color: 'rgba(74,222,128,0.4)', fontStyle: 'italic' }}>
            {'> Awaiting decision triggers...'}
          </div>
        ) : (
          recentDecisions.map((entry, i) => (
            <div key={i} className="decision-entry">
              {entry}
            </div>
          ))
        )}
        <div style={{ marginTop: 6, color: 'rgba(74,222,128,0.3)' }}>
          {'> _'}
        </div>
      </div>
    </div>
  );
}
