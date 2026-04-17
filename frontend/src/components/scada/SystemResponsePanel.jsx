// SystemResponsePanel.jsx — Active defense responses
import { emitNodeIsolate, emitNodeRestore } from '../../socket/socketClient';

export default function SystemResponsePanel({ node }) {
  const actions = node.responseActions || [];

  const responses = [
    { key: 'rate_limiting', label: 'Rate Limiting', icon: '🚦' },
    { key: 'load_redistribution', label: 'Load Redistribution', icon: '⚡' },
    { key: 'isolation', label: 'Node Isolation', icon: '🔒' },
  ];

  const isIsolated = node.status === 'isolated';

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

      <div style={{ marginTop: 12 }}>
        {isIsolated ? (
          <button
            className="btn btn-success"
            style={{ width: '100%', fontSize: 12 }}
            onClick={() => emitNodeRestore(node.id)}
          >
            🔓 Restore Node
          </button>
        ) : (
          <button
            className="btn btn-danger"
            style={{ width: '100%', fontSize: 12 }}
            onClick={() => emitNodeIsolate(node.id)}
          >
            🔒 Isolate Node
          </button>
        )}
      </div>
    </div>
  );
}
