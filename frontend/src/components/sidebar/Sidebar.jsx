// Sidebar.jsx — Floating, draggable sidebar with attack injection + defence toggle
import { useState } from 'react';
import useGridStore from '../../store/useGridStore';
import { sendCommand } from '../../socket/socketClient';
import LogFeed from './LogFeed';
import useDraggable from '../../hooks/useDraggable';

export default function Sidebar() {
  const nodes = useGridStore((s) => s.nodes);
  const simStatus = useGridStore((s) => s.simStatus);
  const startSimulation = useGridStore((s) => s.startSimulation);
  const stopSimulation = useGridStore((s) => s.stopSimulation);

  const isDefenseActive = useGridStore((s) => s.isDefenseActive);
  const defensePending = useGridStore((s) => s.defensePending);
  const setDefensePending = useGridStore((s) => s.setDefensePending);

  const [selectedAttack, setSelectedAttack] = useState('DDOS');
  const [targetNode, setTargetNode] = useState('0');
  const [collapsed, setCollapsed] = useState(false);

  const { position, handleMouseDown } = useDraggable({
    x: window.innerWidth - 370,
    y: 50,
  });

  const handleStart = () => {
    startSimulation(selectedAttack);
    sendCommand('START_SCENARIO', selectedAttack, targetNode);
  };

  const handleStop = () => {
    stopSimulation();
    sendCommand('STOP_ATTACK');
  };

  // Defence toggle: emit WS command immediately on click.
  // Do NOT flip the visual indicator optimistically — wait for backend confirmation
  // via the defense_active flag in the next telemetry broadcast.
  const handleDefenseToggle = () => {
    if (defensePending) return; // Debounce while waiting for confirmation
    const nextState = !isDefenseActive;
    setDefensePending();
    sendCommand(nextState ? 'DEFENSE_ON' : 'DEFENSE_OFF');
  };

  // Collapsed icon strip
  if (collapsed) {
    return (
      <div
        className="floating-panel collapsed"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="collapsed-strip">
          <div
            className="strip-icon"
            onClick={() => setCollapsed(false)}
            title="Expand Panel"
            style={{ color: '#00ffcc' }}
          >
            ◀
          </div>
          <div className="strip-icon" title="Attack Injection" style={{ color: '#ef4444' }}>⚡</div>
          <div
            className="strip-icon"
            title={isDefenseActive ? 'Defence: ON' : 'Defence: OFF'}
            style={{ color: isDefenseActive ? '#00ffcc' : '#ef4444' }}
          >
            🛡
          </div>
          <div className="strip-icon" title="Telemetry" style={{ color: '#94a3b8' }}>📊</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="floating-panel"
      style={{
        left: position.x,
        top: position.y,
        width: '340px',
        height: 'calc(100vh - 100px)',
        maxHeight: 'calc(100vh - 100px)',
      }}
    >
      {/* Drag Handle */}
      <div className="drag-handle" onMouseDown={handleMouseDown}>
        <span className="handle-title">Control Panel</span>
        <div className="handle-actions">
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(true)}
            title="Collapse"
          >
            ▶
          </button>
        </div>
      </div>

      {/* 1. Attack Orchestrator */}
      <div style={{
        padding: '16px',
        background: 'rgba(239, 68, 68, 0.04)',
        borderBottom: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#ff3333', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <span>Attack Injection</span>
          {simStatus === 'RUNNING' && <span style={{ color: '#ff3333', animation: 'blink 1.5s infinite' }}>ACTIVE</span>}
        </div>

        {simStatus === 'IDLE' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select
              value={selectedAttack}
              onChange={(e) => setSelectedAttack(e.target.value)}
              style={{ width: '100%', padding: '7px', background: 'rgba(0,0,0,0.5)', color: '#ff3333', border: '1px solid rgba(239, 68, 68, 0.3)', outline: 'none', borderRadius: '4px', fontSize: '10px' }}
            >
              <option value="DDOS">Volumetric DDoS</option>
              <option value="SPOOFING">Identity Spoofing</option>
              <option value="FDI">False Data Injection</option>
            </select>
            <select
              value={targetNode}
              onChange={(e) => setTargetNode(e.target.value)}
              style={{ width: '100%', padding: '7px', background: 'rgba(0,0,0,0.5)', color: '#ff3333', border: '1px solid rgba(239, 68, 68, 0.3)', outline: 'none', borderRadius: '4px', fontSize: '10px' }}
            >
              {nodes.map(n => <option key={n.id} value={n.id}>Target: Node {n.id}</option>)}
            </select>
            <button
              onClick={handleStart}
              style={{ width: '100%', padding: '9px', background: '#ff3333', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '10px', borderRadius: '4px' }}
            >
              Execute Attack
            </button>
          </div>
        ) : (
          <button
            onClick={handleStop}
            style={{ width: '100%', padding: '9px', background: 'transparent', color: '#ff3333', border: '1px solid #ff3333', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '10px', borderRadius: '4px' }}
          >
            Terminate Sequence
          </button>
        )}
      </div>

      {/* 2. Defence Toggle — reflects backend-confirmed state, not optimistic */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0, 255, 204, 0.15)' }}>
        <button
          className={`defence-toggle ${isDefenseActive ? 'on' : 'off'}`}
          onClick={handleDefenseToggle}
          disabled={defensePending}
          style={defensePending ? { opacity: 0.5, cursor: 'wait' } : {}}
        >
          {defensePending
            ? 'Defence: SYNCING...'
            : isDefenseActive ? 'Defence: ON' : 'Defence: OFF'
          }
        </button>
      </div>

      {/* 3. Log Feed */}
      <LogFeed />
    </div>
  );
}