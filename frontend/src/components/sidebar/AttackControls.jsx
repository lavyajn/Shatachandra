// AttackControls.jsx — Attack type selector + target + start/stop
import { useState, useCallback } from 'react';
import useGridStore from '../../store/useGridStore';
import { emitAttackStart, emitAttackStop } from '../../socket/socketClient';
import { STATUS_COLORS } from '../../constants/theme';

export default function AttackControls() {
  const nodes = useGridStore((s) => s.nodes);
  const [attackType, setAttackType] = useState('fdi');
  const [targetNodeId, setTargetNodeId] = useState('B');
  const [startDisabled, setStartDisabled] = useState(false);
  const [error, setError] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  const targetNode = nodes.find(n => n.id === targetNodeId);
  const isTargetAttacked = targetNode?.attackActive;
  const isTargetIsolated = targetNode?.status === 'isolated';

  const handleStart = useCallback(() => {
    if (startDisabled) return;
    setError(null);
    setStartDisabled(true);
    emitAttackStart(targetNodeId, attackType);
    setTimeout(() => setStartDisabled(false), 500);
  }, [targetNodeId, attackType, startDisabled]);

  const handleStop = useCallback(() => {
    setError(null);
    emitAttackStop(targetNodeId);
  }, [targetNodeId]);

  const handleReset = useCallback(async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    setResetConfirm(false);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/reset', { method: 'POST' });
      const data = await res.json();
      if (!data.success) setError(data.error);
    } catch (err) {
      setError('Failed to reset simulation');
    }
  }, [resetConfirm]);

  const attackTypes = [
    { key: 'fdi', label: 'FDI' },
    { key: 'ddos', label: 'DDoS' },
    { key: 'spoofing', label: 'Spoof' },
  ];

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        <span>💥 Inject Attack</span>
      </div>

      {/* Attack Type Selector */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Attack Type
        </div>
        <div className="pill-group">
          {attackTypes.map(at => (
            <button
              key={at.key}
              className={`pill ${attackType === at.key ? `active ${at.key}` : ''}`}
              onClick={() => setAttackType(at.key)}
            >
              {at.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Node Selector */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Target Node
        </div>
        <div className="pill-group">
          {nodes.map(n => (
            <button
              key={n.id}
              className={`pill node-pill status-${n.status} ${targetNodeId === n.id ? 'active' : ''}`}
              onClick={() => setTargetNodeId(n.id)}
              style={n.attackActive ? { boxShadow: '0 0 6px rgba(239,68,68,0.4)' } : {}}
            >
              {n.id}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          className="btn btn-danger"
          style={{ flex: 1 }}
          onClick={handleStart}
          disabled={startDisabled || isTargetAttacked || isTargetIsolated}
        >
          ▶ Start
        </button>
        <button
          className="btn btn-success"
          style={{ flex: 1 }}
          onClick={handleStop}
          disabled={!isTargetAttacked}
        >
          ⏹ Stop
        </button>
      </div>

      <button
        className={`btn ${resetConfirm ? 'btn-danger' : 'btn-warning'}`}
        style={{ width: '100%', fontSize: 12 }}
        onClick={handleReset}
      >
        {resetConfirm ? '⚠ Confirm Reset?' : '🔄 Reset Simulation'}
      </button>

      {/* Error Message */}
      {error && (
        <div style={{
          marginTop: 8,
          padding: '6px 10px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 6,
          fontSize: 11,
          color: '#ef4444',
        }}>
          {error}
        </div>
      )}

      {/* Status hints */}
      {isTargetAttacked && (
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--status-high)' }}>
          ⚠ Node {targetNodeId} is already under attack
        </div>
      )}
      {isTargetIsolated && (
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--status-isolated)' }}>
          🔒 Node {targetNodeId} is isolated
        </div>
      )}
    </div>
  );
}
