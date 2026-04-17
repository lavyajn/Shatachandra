// GridStatusPanel.jsx
import { STATUS_COLORS } from '../../constants/theme';

export default function GridStatusPanel({ node }) {
  const load = node.displayedLoad ?? node.currentLoad;
  const pct = Math.min((load / node.capacity) * 100, 120);
  
  // ATOMIC CLAMP
  const trust = Math.max(0, Math.min(100, node.trust ?? 100));

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (circumference * Math.min(pct, 100)) / 100;
  const gaugeColor = pct < 70 ? '#10b981' : pct < 90 ? '#f59e0b' : '#ef4444';
  const trustColor = trust > 80 ? '#10b981' : trust > 50 ? '#f59e0b' : trust > 30 ? '#f97316' : '#ef4444';

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="panel-title">📊 Grid Status</div>
      <div className="radial-gauge-container">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle cx="65" cy="65" r={radius} fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashoffset} transform="rotate(-90 65 65)" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
          <text x="65" y="58" textAnchor="middle" fill={gaugeColor} fontSize="22" fontWeight="800" fontFamily="var(--font-mono)">{pct.toFixed(0)}%</text>
          <text x="65" y="78" textAnchor="middle" fill="#94a3b8" fontSize="10">LOAD</text>
        </svg>
      </div>
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 13 }}><span style={{ color: 'white' }}>{load.toFixed(1)} MW</span> / {node.capacity} MW</div>
      <div style={{ width: '100%', marginTop: 10 }}>
        <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span>Trust Score</span>
          <span style={{ color: trustColor, fontWeight: 700 }}>{trust.toFixed(1)}%</span>
        </div>
        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${trust}%`, height: '100%', background: trustColor, transition: 'width 0.3s ease' }} />
        </div>
      </div>
    </div>
  );
}