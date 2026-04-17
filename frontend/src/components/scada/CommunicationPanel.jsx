// CommunicationPanel.jsx — Trust score visualization + packet estimate
export default function CommunicationPanel({ node }) {
  const trust = node.trust ?? 100;
  const total = node.packetRate + node.maliciousPacketRate;
  const normalPct = total > 0 ? (node.packetRate / total) * 100 : 100;
  const maliciousPct = total > 0 ? (node.maliciousPacketRate / total) * 100 : 0;
  const isUnderThreat = trust < 50;

  return (
    <div className="panel">
      <div className="panel-title">📡 Communication</div>

      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{
          fontSize: 28,
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          color: isUnderThreat ? 'var(--status-compromised)' : 'var(--text-primary)',
          transition: 'color 0.3s'
        }}>
          {total.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          packets/sec (est.)
        </div>
      </div>

      <div className="comm-bar-container">
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
            <span>Normal Packets</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#3b82f6' }}>{node.packetRate}/s</span>
          </div>
          <div className="comm-bar">
            <div
              className="comm-bar-fill"
              style={{
                width: `${Math.min(normalPct, 100)}%`,
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
            <span>Malicious Packets</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#ef4444' }}>{node.maliciousPacketRate}/s</span>
          </div>
          <div className="comm-bar">
            <div
              className="comm-bar-fill"
              style={{
                width: `${Math.min(maliciousPct, 100)}%`,
                background: 'linear-gradient(90deg, #ef4444, #f97316)',
                transition: isUnderThreat ? 'width 0.15s ease' : 'width 0.3s ease',
                animation: isUnderThreat ? 'alertPulse 0.5s infinite' : 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Trust indicator */}
      <div style={{
        marginTop: 10,
        padding: '6px 10px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
      }}>
        <span style={{ color: 'var(--text-muted)' }}>Trust Score</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          color: trust > 80 ? '#10b981' : trust > 50 ? '#f59e0b' : '#ef4444',
        }}>
          {trust.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
