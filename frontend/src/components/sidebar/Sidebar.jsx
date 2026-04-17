// Sidebar.jsx — Always-visible right sidebar with system info + logs
import useGridStore from '../../store/useGridStore';
import LogFeed from './LogFeed';

export default function Sidebar() {
  const nodes = useGridStore((s) => s.nodes);
  const connectionStatus = useGridStore((s) => s.connectionStatus);
  const selectedNodeId = useGridStore((s) => s.selectedNodeId);
  const decisionLog = useGridStore((s) => s.decisionLog);

  const activeAttacks = nodes.filter(n => n.attackActive).length;
  const compromisedNodes = nodes.filter(n => n.status === 'compromised').length;
  const isolatedNodes = nodes.filter(n => n.status === 'isolated').length;
  const highestRiskNode = nodes.reduce((highest, n) => {
    const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const nRisk = riskOrder[n.predictedRisk] || 0;
    const hRisk = highest ? (riskOrder[highest.predictedRisk] || 0) : -1;
    return nRisk > hRisk ? n : highest;
  }, null);

  // Find lowest trust node
  const lowestTrustNode = nodes.reduce((lowest, n) => {
    if (!lowest) return n;
    return (n.trust ?? 100) < (lowest.trust ?? 100) ? n : lowest;
  }, null);

  return (
    <div className="sidebar">
      {/* System Info Panel */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          <span>📊 System Overview</span>
        </div>

        {/* Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, fontSize: 12 }}>
          <span className={`connection-dot ${connectionStatus}`} />
          <span style={{
            color: connectionStatus === 'connected' ? 'var(--status-normal)'
              : connectionStatus === 'connecting' ? 'var(--status-high)'
              : 'var(--status-compromised)',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}>
            {connectionStatus}
          </span>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Threats Detected</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: activeAttacks > 0 ? 'var(--status-compromised)' : 'var(--text-secondary)',
            }}>
              {activeAttacks}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Compromised</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: compromisedNodes > 0 ? 'var(--status-compromised)' : 'var(--text-secondary)',
            }}>
              {compromisedNodes}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Isolated</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: isolatedNodes > 0 ? 'var(--status-high)' : 'var(--text-secondary)',
            }}>
              {isolatedNodes}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Highest Risk</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}>
              {highestRiskNode ? (
                <span className={`risk-badge ${highestRiskNode.predictedRisk}`} style={{ fontSize: 10, padding: '1px 8px' }}>
                  {highestRiskNode.id}: {(highestRiskNode.predictedRisk || 'low').toUpperCase()}
                </span>
              ) : '—'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Nodes Online</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              {nodes.filter(n => n.status !== 'isolated').length} / {nodes.length}
            </span>
          </div>

          {/* Lowest Trust Score */}
          {lowestTrustNode && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Lowest Trust</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: (lowestTrustNode.trust ?? 100) < 50 ? 'var(--status-compromised)'
                  : (lowestTrustNode.trust ?? 100) < 80 ? 'var(--status-high)'
                  : 'var(--status-normal)',
              }}>
                Node {lowestTrustNode.id}: {(lowestTrustNode.trust ?? 100).toFixed(0)}%
              </span>
            </div>
          )}

          {selectedNodeId && (
            <div style={{
              marginTop: 4,
              padding: '4px 8px',
              background: 'rgba(59,130,246,0.08)',
              borderRadius: 6,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: 'var(--accent-blue)' }}>Selected</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                Node {selectedNodeId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* C++ Defense Engine Decision */}
      {decisionLog && decisionLog !== 'System Stable. Monitoring packet flow.' && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>🧠 Defense Engine</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: '#4ade80',
            background: 'rgba(0,0,0,0.4)',
            padding: '8px 10px',
            borderRadius: 6,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {'> '}{decisionLog}
          </div>
        </div>
      )}

      {/* Log Feed */}
      <LogFeed />
    </div>
  );
}
