import { useState } from 'react';
import useGridStore from '../../store/useGridStore';
import { sendCommand } from '../../socket/socketClient';
import LogFeed from './LogFeed';

export default function Sidebar() {
  const nodes = useGridStore((s) => s.nodes);
  const simStatus = useGridStore((s) => s.simStatus);
  const startSimulation = useGridStore((s) => s.startSimulation);
  const stopSimulation = useGridStore((s) => s.stopSimulation);
  
  // NEW: Defense State
  const isDefenseActive = useGridStore((s) => s.isDefenseActive);
  const toggleDefense = useGridStore((s) => s.toggleDefense);

  const [selectedAttack, setSelectedAttack] = useState('DDOS');
  const [targetNode, setTargetNode] = useState('0');

  const handleStart = () => {
    startSimulation(selectedAttack); 
    sendCommand('START_SCENARIO', selectedAttack, targetNode);
  };

  const handleStop = () => {
    stopSimulation();
    sendCommand('STOP_ATTACK');
  };

  // NEW: Toggle handler
  const handleDefenseToggle = () => {
    const nextState = !isDefenseActive;
    toggleDefense();
    // Use your existing sendCommand utility
    sendCommand(nextState ? 'DEFENSE_ON' : 'DEFENSE_OFF');
  };

  return (
    <div className="sidebar">
      {/* 1. Attack Orchestrator */}
      <div className="sidebar-section" style={{ background: 'rgba(239, 68, 68, 0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="sidebar-section-title">
          <span>⚔️ Attack Orchestrator</span>
          {simStatus === 'RUNNING' && <span className="status-badge compromised" style={{ fontSize: 9 }}>ACTIVE</span>}
        </div>

        {simStatus === 'IDLE' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select className="btn" value={selectedAttack} onChange={(e) => setSelectedAttack(e.target.value)}>
              <option value="DDOS">DDoS Flood</option>
              <option value="SPOOFING">Identity Spoofing</option>
              <option value="FDI">False Data Injection</option>
            </select>
            <select className="btn" value={targetNode} onChange={(e) => setTargetNode(e.target.value)}>
              {nodes.map(n => <option key={n.id} value={n.id}>Node {n.id}</option>)}
            </select>
            <button className="btn btn-danger" onClick={handleStart}>🚀 INITIATE ATTACK</button>
          </div>
        ) : (
          <button className="btn btn-warning" onClick={handleStop}>⏹ TERMINATE ATTACK</button>
        )}
      </div>

      {/* 2. NEW: Defense Toggle Switch */}
      <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          onClick={handleDefenseToggle}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${isDefenseActive ? '#10b981' : '#ef4444'}`,
            background: isDefenseActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isDefenseActive ? '#10b981' : '#ef4444',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          {isDefenseActive ? '🛡️ DEFENSE ENGINE: ACTIVE' : '⚠️ DEFENSE ENGINE: DISABLED'}
        </button>
      </div>

      {/* 3. Log Feed */}
      <LogFeed />
    </div>
  );
}