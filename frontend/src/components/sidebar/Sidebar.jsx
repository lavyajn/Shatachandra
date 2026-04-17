import { useState } from 'react';
import useGridStore from '../../store/useGridStore';
import { sendCommand } from '../../socket/socketClient';
import LogFeed from './LogFeed';

export default function Sidebar() {
  const nodes = useGridStore((s) => s.nodes);
  const simStatus = useGridStore((s) => s.simStatus);
  const startSimulation = useGridStore((s) => s.startSimulation);
  const stopSimulation = useGridStore((s) => s.stopSimulation);

  const [selectedAttack, setSelectedAttack] = useState('DDOS');
  const [targetNode, setTargetNode] = useState('0');

  // This function was missing or incorrectly named!
  const handleStart = () => {
    startSimulation(selectedAttack); 
    sendCommand('START_SCENARIO', selectedAttack, targetNode);
  };

  // FIX: This is the function the error was complaining about
  const handleStop = () => {
    stopSimulation(); // Updates Zustand to 'IDLE'
    sendCommand('STOP_ATTACK'); // Sends the kill signal to C++
  };

  return (
    <div className="sidebar">
      <div className="sidebar-section" style={{ background: 'rgba(239, 68, 68, 0.05)', borderBottom: '2px solid rgba(239, 68, 68, 0.1)' }}>
        <div className="sidebar-section-title">
          <span>⚔️ Attack Orchestrator</span>
          {simStatus === 'RUNNING' && <span className="status-badge compromised" style={{ fontSize: 9 }}>ACTIVE</span>}
        </div>

        {simStatus === 'IDLE' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>SCENARIO TYPE</label>
              <select 
                className="btn" 
                value={selectedAttack}
                onChange={(e) => setSelectedAttack(e.target.value)}
              >
                <option value="DDOS">DDoS Flood</option>
                <option value="SPOOFING">Identity Spoofing</option>
                <option value="FDI">False Data Injection</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>TARGET NODE</label>
              <select 
                className="btn" 
                value={targetNode}
                onChange={(e) => setTargetNode(e.target.value)}
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.label || `Node ${n.id}`}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn-danger" onClick={handleStart}>
              🚀 INITIATE ATTACK
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             {/* The button that was crashing the app */}
             <button className="btn btn-warning" onClick={handleStop}>
              ⏹ TERMINATE ATTACK
            </button>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Simulating {selectedAttack} on Node {targetNode}...
            </p>
          </div>
        )}
      </div>

      <LogFeed />
    </div>
  );
}