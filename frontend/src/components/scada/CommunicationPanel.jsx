// CommunicationPanel.jsx — Packet rate visualization
export default function CommunicationPanel({ node }) {
  const total = node.packetRate + node.maliciousPacketRate;
  const normalPct = total > 0 ? (node.packetRate / (total + node.maliciousPacketRate)) * 100 : 100;
  const maliciousPct = total > 0 ? (node.maliciousPacketRate / (total + node.maliciousPacketRate)) * 100 : 0;
  const isDDoS = node.attackType === 'ddos' && node.attackActive;

  return (
    <div className="panel">
      <div className="panel-title">📡 Communication</div>

      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{
          fontSize: 28,
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          color: isDDoS ? 'var(--status-compromised)' : 'var(--text-primary)',
          transition: 'color 0.3s'
        }}>
          {(node.packetRate + node.maliciousPacketRate).toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          packets/sec
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
                transition: isDDoS ? 'width 0.15s ease' : 'width 0.3s ease',
                animation: isDDoS ? 'alertPulse 0.5s infinite' : 'none'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
