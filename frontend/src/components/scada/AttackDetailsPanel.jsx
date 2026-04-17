// AttackDetailsPanel.jsx — Active attack information
import { useState, useEffect } from 'react';
import { ATTACK_LABELS, ATTACK_DESCRIPTIONS, ATTACK_COLORS } from '../../constants/theme';

export default function AttackDetailsPanel({ node }) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!node.attackActive || !node.attackStartTime) {
      setDuration(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = (Date.now() - new Date(node.attackStartTime).getTime()) / 1000;
      setDuration(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [node.attackActive, node.attackStartTime]);

  if (!node.attackActive) {
    return (
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="panel-title">🛡 Attack Status</div>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-normal)' }}>No Active Attack</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>System operating normally</div>
      </div>
    );
  }

  const attackColor = ATTACK_COLORS[node.attackType] || '#ef4444';
  const startTime = node.attackStartTime
    ? new Date(node.attackStartTime).toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';

  return (
    <div className="panel" style={{ borderColor: attackColor + '40' }}>
      <div className="panel-title">🛡 Attack Status</div>

      <div style={{ marginBottom: 10, textAlign: 'center' }}>
        <span className={`attack-badge ${node.attackType}`}>
          {ATTACK_LABELS[node.attackType]}
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
        {ATTACK_DESCRIPTIONS[node.attackType]}
      </div>
    </div>
  );
}
