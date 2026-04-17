// CommunicationPanel.jsx — Packet traffic breakdown (trust score removed — shown in GridStatusPanel)
export default function CommunicationPanel({ node }) {
  const total = node.packetRate + node.maliciousPacketRate;
  const normalPct = total > 0 ? (node.packetRate / total) * 100 : 100;
  const maliciousPct = total > 0 ? (node.maliciousPacketRate / total) * 100 : 0;

  return (
    <div className="panel">
      <div className="panel-title">📡 Communication</div>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: maliciousPct > 30 ? '#ef4444' : 'white' }}>{total.toLocaleString()}</div>
        <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.06em' }}>PACKETS/SEC</div>
      </div>
      <div className="comm-bar-container">
        <div style={{ fontSize: 9, display: 'flex', justifyContent: 'space-between' }}>
          <span>Normal</span><span style={{ color: '#3b82f6' }}>{node.packetRate}/s</span>
        </div>
        <div className="comm-bar"><div style={{ width: `${Math.min(normalPct, 100)}%`, background: '#3b82f6', height: '100%', borderRadius: '6px' }} /></div>
        <div style={{ fontSize: 9, display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span>Malicious</span><span style={{ color: '#ef4444' }}>{node.maliciousPacketRate}/s</span>
        </div>
        <div className="comm-bar"><div style={{ width: `${Math.min(maliciousPct, 100)}%`, background: '#ef4444', height: '100%', borderRadius: '6px' }} /></div>
      </div>
    </div>
  );
}