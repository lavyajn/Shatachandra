// CommunicationPanel.jsx
export default function CommunicationPanel({ node }) {
  // ATOMIC CLAMP
  const trust = Math.max(0, Math.min(100, node.trust ?? 100));
  
  const total = node.packetRate + node.maliciousPacketRate;
  const normalPct = total > 0 ? (node.packetRate / total) * 100 : 100;
  const maliciousPct = total > 0 ? (node.maliciousPacketRate / total) * 100 : 0;
  const isUnderThreat = trust < 50;

  return (
    <div className="panel">
      <div className="panel-title">📡 Communication</div>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: isUnderThreat ? '#ef4444' : 'white' }}>{total.toLocaleString()}</div>
        <div style={{ fontSize: 10, color: '#94a3b8' }}>packets/sec (est.)</div>
      </div>
      <div className="comm-bar-container">
        <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span>Normal</span><span style={{ color: '#3b82f6' }}>{node.packetRate}/s</span>
        </div>
        <div className="comm-bar"><div style={{ width: `${Math.min(normalPct, 100)}%`, background: '#3b82f6', height: '100%' }} /></div>
        <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span>Malicious</span><span style={{ color: '#ef4444' }}>{node.maliciousPacketRate}/s</span>
        </div>
        <div className="comm-bar"><div style={{ width: `${Math.min(maliciousPct, 100)}%`, background: '#ef4444', height: '100%' }} /></div>
      </div>
      <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: '#94a3b8' }}>Trust Score</span>
        <span style={{ fontWeight: 700, color: trust > 80 ? '#10b981' : trust > 50 ? '#f59e0b' : '#ef4444' }}>
          {trust.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}