// AttackDetailsPanel.jsx — Dynamic threat analysis based on Trust + Status
import { useState, useEffect } from 'react';
import { ATTACK_LABELS, ATTACK_DESCRIPTIONS, ATTACK_COLORS } from '../../constants/theme';

export default function AttackDetailsPanel({ node }) {
  const [duration, setDuration] = useState(0);

  // 1. ATOMIC TRUST & STATUS CHECK
  const trust = Math.max(0, Math.min(100, node.trust ?? 100));
  // Check for numeric status (1, 2) OR string status OR if trust has dropped below 95%
  const isUnderThreat = node.status === 1 || node.status === 2 || 
                        node.status === 'high' || node.status === 'compromised' || 
                        trust < 95;

  // 2. DYNAMIC THREAT LEVEL CALCULATION
  const getThreatLevel = (t) => {
    if (t <= 15) return { label: 'CRITICAL', color: '#7f1d1d', text: '#fca5a5' }; // Deep Red
    if (t <= 40) return { label: 'HIGH', color: '#ef4444', text: '#ffffff' };     // Bright Red
    if (t <= 70) return { label: 'ELEVATED', color: '#f59e0b', text: '#ffffff' }; // Orange
    if (t < 95)  return { label: 'LOW', color: '#3b82f6', text: '#ffffff' };      // Blue
    return { label: 'NONE', color: 'transparent', text: '#10b981' };
  };

  const threat = getThreatLevel(trust);

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
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
        <div className="panel-title">🛡 Threat Status</div>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981', letterSpacing: '1px' }}>SYSTEM NOMINAL</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
          TRUST: {trust.toFixed(1)}% // NO LEAKS
        </div>
      </div>
    );
  }

  const attackType = node.attackType || 'fdi';
  const attackColor = threat.color;
  const startTime = node.attackStartTime
    ? new Date(node.attackStartTime).toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';

  return (
    <div className="panel" style={{ borderLeft: `4px solid ${attackColor}`, background: `${attackColor}10` }}>
      <div className="panel-title">🛡 Threat Analysis</div>

      {/* NEW: Dynamic Threat Level Indicator */}
      <div style={{ 
        marginBottom: 12, 
        padding: '8px', 
        background: attackColor, 
        color: threat.text, 
        textAlign: 'center', 
        borderRadius: '4px',
        fontWeight: 900,
        fontSize: '14px',
        letterSpacing: '2px',
        boxShadow: `0 0 15px ${attackColor}40`
      }}>
        {threat.label} THREAT
      </div>

      <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Vector</span>
          <span style={{ fontWeight: 700, color: attackColor }}>{ATTACK_LABELS[attackType] || 'ANOMALY'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Detection Time</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{startTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Engagement</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{duration.toFixed(1)}s</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Integrity</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: attackColor }}>
            {trust.toFixed(1)}%
          </span>
        </div>
      </div>

      <div style={{
        marginTop: 10,
        fontSize: 10,
        color: '#cbd5e1',
        padding: '8px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 4,
        border: '1px solid rgba(255,255,255,0.05)',
        lineHeight: 1.4,
        fontStyle: 'italic'
      }}>
        {ATTACK_DESCRIPTIONS[attackType] || 'Automated countermeasures deployed. Prediction engine monitoring cascading load.'}
      </div>
    </div>
  );
}