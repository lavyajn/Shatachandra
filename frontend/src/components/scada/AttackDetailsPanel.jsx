// AttackDetailsPanel.jsx — Active attack/threat information (derived from status + trust)
import { useState, useEffect } from 'react';
import { ATTACK_LABELS, ATTACK_DESCRIPTIONS, ATTACK_COLORS } from '../../constants/theme';

export default function AttackDetailsPanel({ node }) {
  const [duration, setDuration] = useState(0);

  const isUnderThreat = node.status === 'high' || node.status === 'compromised';

  useEffect(() => {
    if (!isUnderThreat || !node.attackStartTime) {
      setDuration(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = (Date.now() - new Date(node.attackStartTime).getTime()) / 1000;
      setDuration(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [isUnderThreat, node.attackStartTime]);

  if (!isUnderThreat) {
    return (
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="panel-title">🛡 Threat Status</div>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-normal)' }}>No Active Threat</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Trust: {(node.trust ?? 100).toFixed(0)}% — System nominal
        </div>
      </div>
    );
  }

  const attackType = node.attackType || 'fdi';
  const attackColor = ATTACK_COLORS[attackType] || '#ef4444';
  const startTime = node.attackStartTime
    ? new Date(node.attackStartTime).toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';

  return (
    <div className="panel" style={{ borderColor: attackColor + '40' }}>
      <div className="panel-title">🛡 Threat Status</div>

      <div style={{ marginBottom: 10, textAlign: 'center' }}>
        <span className={`attack-badge ${attackType}`}>
          {ATTACK_LABELS[attackType] || 'ANOMALY'}
        </span>
      </div>

      <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Target</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Node {node.id}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Detected</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{startTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Duration</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: attackColor }}>
            {duration.toFixed(1)}s
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Trust Score</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: (node.trust ?? 100) < 30 ? '#ef4444' : '#f59e0b',
          }}>
            {(node.trust ?? 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div style={{
        marginTop: 10,
        fontSize: 11,
        color: 'var(--text-secondary)',
        padding: '8px 10px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6,
        lineHeight: 1.5
      }}>
        {ATTACK_DESCRIPTIONS[attackType] || 'Anomalous behavior detected — Defense engine active.'}
      </div>
    </div>
  );
}
