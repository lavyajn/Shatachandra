// SystemResponsePanel.jsx — Defense responses (backend2-controlled, read-only)
import useGridStore from '../../store/useGridStore';

export default function SystemResponsePanel({ node }) {
  const decisionLog = useGridStore((s) => s.decisionLog);
  const actions = node.responseActions || [];

  const responses = [
    { key: 'rate_limiting', label: 'Rate Limiting', icon: '🚦' },
    { key: 'load_redistribution', label: 'Load Redistribution', icon: '⚡' },
    { key: 'isolation', label: 'Node Isolation', icon: '🔒' },
  ];

  return (
    <div className="panel">
      <div className="panel-title">🛡 System Response</div>

      <div className="response-list">
        {responses.map(r => {
          const active = actions.includes(r.key);
          return (
            <div key={r.key} className="response-item">
              <span className="indicator">{active ? '✅' : '⬜'}</span>
              <span style={{
                flex: 1,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {r.icon} {r.label}
              </span>
              {active && (
                <span style={{
                  fontSize: 9,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: 'rgba(16,185,129,0.15)',
                  color: 'var(--status-normal)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}>
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Defense engine status */}
      <div style={{
        marginTop: 12,
        padding: '8px 10px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6,
        fontSize: 11,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          C++ Defense Engine
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', color: '#4ade80', fontSize: 10 }}>
          {node.status === 'isolated'
            ? '→ Node isolated by automated defense'
            : node.status === 'compromised'
            ? '→ Defense engine evaluating response...'
            : node.status === 'high'
            ? '→ Monitoring anomaly — trust declining'
            : '→ All systems nominal'}
        </div>
      </div>
    </div>
  );
}
