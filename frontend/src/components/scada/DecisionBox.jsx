// DecisionBox.jsx — AI Decision Engine display (USP)
export default function DecisionBox({ node }) {
  const decisions = node.decisionLog || [];
  const recentDecisions = decisions.slice(-3);

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
