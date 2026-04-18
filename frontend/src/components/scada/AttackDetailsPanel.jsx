// AttackDetailsPanel.jsx — Dynamic Threat Analysis (THREAT_PROFILES map, no hardcoded strings)
import { useState, useEffect, useRef } from 'react';
import useGridStore from '../../store/useGridStore';

// ============ THREAT PROFILES — One entry per attack type ============
// Adding a new attack type requires only one new object entry — no JSX changes.
const THREAT_PROFILES = {
  'fdi': {
    vector: 'False Data Injection',
    level: 'MEDIUM',
    levelColor: '#f59e0b',
    baseIntegrity: 72.0,
    description: 'Injecting falsified sensor readings to skew load decisions.',
  },
  'ddos': {
    vector: 'Distributed Denial of Service',
    level: 'HIGH',
    levelColor: '#ef4444',
    baseIntegrity: 41.0,
    description: 'Flooding node ingress to saturate bandwidth and induce timeout.',
  },
  'spoofing': {
    vector: 'Identity Spoofing',
    level: 'ELEVATED',
    levelColor: '#f97316',
    baseIntegrity: 58.0,
    description: 'Falsifying node identity and load data to cause misrouted power.',
  },
  'mitm': {
    vector: 'Man-in-the-Middle Intercept',
    level: 'CRITICAL',
    levelColor: '#dc2626',
    baseIntegrity: 28.0,
    description: 'Intercepting edge traffic to replay or alter control packets.',
  },
  'replay': {
    vector: 'Replay Attack',
    level: 'LOW',
    levelColor: '#22c55e',
    baseIntegrity: 88.0,
    description: 'Replaying captured valid packets to trigger duplicate commands.',
  },
};

// Map sidebar attack selector values to threat profile keys
const ATTACK_TYPE_MAP = {
  'DDOS': 'ddos',
  'FDI': 'fdi',
  'SPOOFING': 'spoofing',
};

export default function AttackDetailsPanel({ node }) {
  const activeScenario = useGridStore((s) => s.activeScenario);
  const attackStartTime = useGridStore((s) => s.attackStartTime);

  const [duration, setDuration] = useState(0);
  const [detectionTime, setDetectionTime] = useState('--:--:--');
  const [liveIntegrity, setLiveIntegrity] = useState(100);

  // Determine the active attack type
  const attackTypeKey = node.attackType
    || ATTACK_TYPE_MAP[activeScenario]
    || null;

  // 1. ATOMIC TRUST & STATUS CHECK
  const trust = Math.max(0, Math.min(100, node.trust ?? 100));
  const isUnderThreat = node.status === 'high' || node.status === 'compromised' || trust < 95;

  // Resolve profile — reactive to attack type change
  const profile = attackTypeKey ? THREAT_PROFILES[attackTypeKey] : null;

  // Dynamic threat level from trust (overrides base profile level during live attack)
  const getDynamicThreatLevel = (t) => {
    if (t <= 15) return { label: 'CRITICAL', color: '#dc2626' };
    if (t <= 30) return { label: 'HIGH', color: '#ef4444' };
    if (t <= 60) return { label: 'ELEVATED', color: '#f97316' };
    if (t <= 80) return { label: 'MEDIUM', color: '#f59e0b' };
    if (t < 95) return { label: 'LOW', color: '#3b82f6' };
    return { label: 'NONE', color: '#10b981' };
  };

  const dynamicThreat = getDynamicThreatLevel(trust);

  // 2. Detection Time — starts running mm:ss:ms when attack is injected
  useEffect(() => {
    if (!isUnderThreat || !node.attackStartTime) {
      setDetectionTime('--:--:--');
      setDuration(0);
      return;
    }

    // Set detection time stamp once
    const stamp = new Date(node.attackStartTime).toLocaleTimeString('en-US', { hour12: false });
    setDetectionTime(stamp);

    // Running engagement timer
    const interval = setInterval(() => {
      const elapsed = (Date.now() - new Date(node.attackStartTime).getTime()) / 1000;
      setDuration(elapsed);
    }, 100);
    return () => clearInterval(interval);
  }, [isUnderThreat, node.attackStartTime]);

  // 3. Live integrity — decays during active attack, floors at profile minimum
  useEffect(() => {
    if (!isUnderThreat) {
      setLiveIntegrity(trust);
      return;
    }
    // During active attack, integrity = trust (which the backend is already decaying)
    setLiveIntegrity(trust);
  }, [trust, isUnderThreat]);

  // ============ NOMINAL STATE ============
  if (!isUnderThreat) {
    return (
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
        <div className="panel-title">🛡 Threat Status</div>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981', letterSpacing: '1px' }}>SYSTEM NOMINAL</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
          TRUST: {trust.toFixed(1)}% // NO LEAKS
        </div>
      </div>
    );
  }

  // ============ ACTIVE THREAT STATE ============
  const displayProfile = profile || {
    vector: 'Unknown Vector',
    level: dynamicThreat.label,
    levelColor: dynamicThreat.color,
    baseIntegrity: trust,
    description: 'Automated countermeasures monitoring cascading load.',
  };

  // Use dynamic threat level (derived from live trust) rather than static profile level
  const threatLabel = dynamicThreat.label;
  const threatColor = dynamicThreat.color;

  // Format engagement duration
  const formatDuration = (s) => {
    if (s < 60) return `${s.toFixed(1)}s`;
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(0);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="panel" style={{ borderLeft: `4px solid ${threatColor}`, background: `${threatColor}10` }}>
      <div className="panel-title">🛡 Threat Analysis</div>

      {/* Dynamic Threat Level Indicator */}
      <div style={{
        marginBottom: 12,
        padding: '8px',
        background: threatColor,
        color: '#ffffff',
        textAlign: 'center',
        borderRadius: '4px',
        fontWeight: 900,
        fontSize: '14px',
        letterSpacing: '2px',
        boxShadow: `0 0 15px ${threatColor}40`
      }}>
        {threatLabel} THREAT
      </div>

      <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* 1. Vector — from profile, reactive to attack type */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Vector</span>
          <span style={{ fontWeight: 700, color: threatColor }}>{displayProfile.vector}</span>
        </div>
        {/* 2. Threat Level badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Level</span>
          <span style={{
            fontWeight: 800,
            padding: '1px 8px',
            borderRadius: '3px',
            fontSize: 10,
            background: `${threatColor}20`,
            color: threatColor,
            border: `1px solid ${threatColor}40`,
          }}>{threatLabel}</span>
        </div>
        {/* 3. Detection Time — running timestamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Detection Time</span>
          <span>{detectionTime}</span>
        </div>
        {/* 4. Engagement Duration — running seconds */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Engagement</span>
          <span style={{ fontWeight: 700 }}>{formatDuration(duration)}</span>
        </div>
        {/* 5. Integrity % — live from trust, decays during attack */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Integrity</span>
          <span style={{ fontWeight: 800, color: threatColor }}>
            {liveIntegrity.toFixed(1)}%
          </span>
        </div>
        {/* 6. Integrity bar */}
        <div style={{
          height: 6,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 3,
          overflow: 'hidden',
          marginTop: 2,
        }}>
          <div style={{
            width: `${Math.max(0, Math.min(100, liveIntegrity))}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${threatColor}, ${threatColor}80)`,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Description text — unique per attack type */}
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
        {displayProfile.description}
      </div>
    </div>
  );
}