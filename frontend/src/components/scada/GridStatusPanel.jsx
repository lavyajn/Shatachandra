// GridStatusPanel.jsx — Radial gauge showing load percentage
import { useMemo } from 'react';
import { STATUS_COLORS } from '../../constants/theme';

export default function GridStatusPanel({ node }) {
  const load = node.displayedLoad ?? node.currentLoad;
  const pct = Math.min((load / node.capacity) * 100, 120);
  const statusColor = STATUS_COLORS[node.status] || STATUS_COLORS.normal;

  const isSpoofed = node.attackType === 'spoofing' && node.attackActive;

  // SVG arc for radial gauge
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (circumference * Math.min(pct, 100)) / 100;

  const gaugeColor = pct < 70 ? '#10b981' : pct < 90 ? '#f59e0b' : '#ef4444';

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="panel-title">📊 Grid Status</div>

      <div className="radial-gauge-container">
        <svg width="130" height="130" viewBox="0 0 130 130">
          {/* Background circle */}
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          {/* Progress arc */}
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke={gaugeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            transform="rotate(-90 65 65)"
            style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
          />
          {/* Center text */}
          <text x="65" y="58" textAnchor="middle" fill={gaugeColor} fontSize="22" fontWeight="800" fontFamily="var(--font-mono)">
            {pct.toFixed(0)}%
          </text>
          <text x="65" y="78" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="var(--font-sans)">
            LOAD
          </text>
        </svg>
      </div>

      <div style={{ textAlign: 'center', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 13/*, fontWeight: 600*/ }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{load.toFixed(1)} MW</span>
        <span style={{ color: 'var(--text-muted)' }}> / {node.capacity} MW</span>
      </div>

      <div style={{ marginTop: 8 }}>
        <span className={`status-badge ${node.status}`}>
          {node.status.toUpperCase()}
        </span>
      </div>

      {isSpoofed && (
        <div style={{ marginTop: 8, fontSize: 11, textAlign: 'center' }}>
          <div style={{ color: '#eab308', fontWeight: 600 }}>⚠ SPOOFED</div>
          <div style={{ color: 'var(--text-muted)' }}>
            Displayed: {node.displayedLoad?.toFixed(1)} MW
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            True: {node.trueLoad?.toFixed(1)} MW
          </div>
        </div>
      )}
    </div>
  );
}
