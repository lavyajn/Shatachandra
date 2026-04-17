import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import useStore from './store/useStore';
import { TransmissionTower } from './components/TransmissionTower';
import { DataLink } from './components/DataLink';

const WS_URL = 'ws://localhost:8080';

const TOWER_POSITIONS = {
    0: [-80, 0, -45],
    1: [-35, 0,  45],
    2: [  0, 0, -20], 
    3: [ 50, 0,  55],
    4: [ 88, 0,   0]
};

const MITRE_CONTEXT = {
    DDOS: "MITRE ICS: T0814 (Denial of Service)",
    FDI: "MITRE ICS: T0836 (Modify Parameter)",
    SPOOF: "MITRE ICS: T0856 (Spoof Reporting)"
};

export default function App() {
    const updateTelemetry = useStore((state) => state.updateTelemetry);
    const decisionLog    = useStore((state) => state.decisionLog);
    const nodes          = useStore((state) => state.nodes || []);
    
    const [readyState, setReadyState] = useState(0);
    const [wsRef, setWsRef] = useState(null);
    
    // Track which attack is selected in the dropdown
    const [attackType, setAttackType] = useState('DDOS');

    // ─── AI NARRATOR (Speech Synthesis) ───
    useEffect(() => {
        if (decisionLog && decisionLog !== "System Booting... Awaiting Telemetry Pipeline.") {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(decisionLog);
            utterance.pitch = 0.9; 
            utterance.rate = 1.1;  
            window.speechSynthesis.speak(utterance);
        }
    }, [decisionLog]);

    // Native WebSocket Connection
    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        setWsRef(ws);
        
        ws.onopen    = () => setReadyState(1);
        ws.onclose   = () => setReadyState(0);
        ws.onmessage = (event) => {
            try   { updateTelemetry(JSON.parse(event.data)); }
            catch { console.log('Waiting for valid JSON stream...'); }
        };
        return () => ws.close();
    }, [updateTelemetry]);

    // Dispatch the selected attack to the Node bridge
    const handleSimulateAttack = () => {
        if (wsRef && wsRef.readyState === 1) {
            wsRef.send(JSON.stringify({
                command: "INJECT_ATTACK",
                payload: { type: attackType, targetNode: 2 }
            }));
            console.log(`Dispatched ${attackType} attack to Node 2`);
        }
    };
    // Dispatch the Reset command
    const handleReset = () => {
        if (wsRef && wsRef.readyState === 1) {
            wsRef.send(JSON.stringify({ command: "RESET" }));
            console.log(`Dispatched RESET command`);
        }
    };
    // Checks both ends of the wire. If either node is compromised (2) or warning (1), the link inherits that color.
    const getLinkStatus = (nodeA, nodeB) => {
        const statA = nodes.find(n => n.id === nodeA)?.status || 0;
        const statB = nodes.find(n => n.id === nodeB)?.status || 0;
        return Math.max(statA, statB); 
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#050505', color: '#00ffcc', fontFamily: 'monospace' }}>

            {/* ─── RIGHT PANEL: ORCHESTRATOR & LOGS ─── */}
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: '20px', width: '350px' }}>
                
                {/* 1. ATTACK ORCHESTRATOR */}
                <div style={{ backgroundColor: 'rgba(20, 0, 0, 0.85)', padding: '20px', border: '1px solid #ff3333', borderRadius: '4px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#ff3333' }}>[ ATTACK ORCHESTRATOR ]</h3>
                    
                    <div style={{ fontSize: '11px', color: '#aa5555', marginBottom: '15px' }}>
                        {MITRE_CONTEXT[attackType]}
                    </div>

                    {/* Dark, Hacker-style Dropdown */}
                    <select 
                        value={attackType} 
                        onChange={(e) => setAttackType(e.target.value)}
                        style={{ 
                            width: '100%', padding: '10px', backgroundColor: '#1a0505', 
                            color: '#ff3333', border: '1px solid #ff3333', marginBottom: '15px', 
                            fontFamily: 'monospace', outline: 'none', cursor: 'pointer' 
                        }}
                    >
                        <option value="DDOS">Volumetric DDoS</option>
                        <option value="FDI">False Data Injection</option>
                        <option value="SPOOF">Packet Spoofing</option>
                    </select>

                    <button 
                        onClick={handleSimulateAttack} 
                        
                        style={{ 
                            width: '100%', padding: '12px', backgroundColor: '#ff3333', 
                            color: '#fff', border: 'none', cursor: 'pointer', 
                            fontWeight: 'bold', fontFamily: 'monospace', fontSize: '14px',
                            boxShadow: '0 0 10px rgba(255, 51, 51, 0.4)'
                        }}>
                        SIMULATE ATTACK
                    </button>

                    {/* --- NEW: RESTORE GRID BUTTON --- */}
                    <button 
                        onClick={handleReset} 
                        style={{ 
                            width: '100%', padding: '10px', backgroundColor: '#003322', 
                            color: '#00ffcc', border: '1px solid #00ffcc', cursor: 'pointer', 
                            fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px'
                        }}>
                        RESTORE GRID
                    </button>
                </div>
                

                {/* 2. LIVE TELEMETRY LOGS */}
                <div style={{ backgroundColor: 'rgba(5, 5, 5, 0.9)', padding: '20px', border: '1px solid #00ffcc', borderRadius: '4px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#00ffcc' }}>[ LIVE TELEMETRY ]</h3>
                    <div style={{ fontSize: '12px', color: readyState === 1 ? '#00ffcc' : '#ff3333', marginBottom: '10px' }}>
                        DATALINK: {readyState === 1 ? 'ACTIVE' : 'OFFLINE'}
                    </div>
                    
                    <div style={{ backgroundColor: '#111', borderLeft: '3px solid #ffcc00', padding: '10px', color: '#ffcc00' }}>
                        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>{decisionLog}</p>
                    </div>
                </div>

            </div>

            {/* ── WebGL GRID ── */}
            <Canvas camera={{ position: [0, 60, 150], fov: 45 }}>
                <color attach="background" args={['#020202']} />
                <ambientLight intensity={0.3} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />
                <Environment preset="night" />

                <Suspense fallback={null}>
                    <group position={[0, -10, 0]}>
                        {Object.entries(TOWER_POSITIONS).map(([id, pos]) => (
                            <TransmissionTower key={`tower-${id}`} nodeId={parseInt(id)} position={pos} scale={0.7} />
                        ))}

                        {/* ─── DATA LINKS (Now checking both ends) ─── */}
                        <DataLink start={TOWER_POSITIONS[0]} end={TOWER_POSITIONS[2]} status={getLinkStatus(0, 2)} />
                        <DataLink start={TOWER_POSITIONS[1]} end={TOWER_POSITIONS[2]} status={getLinkStatus(1, 2)} />
                        <DataLink start={TOWER_POSITIONS[3]} end={TOWER_POSITIONS[2]} status={getLinkStatus(3, 2)} />
                        <DataLink start={TOWER_POSITIONS[4]} end={TOWER_POSITIONS[3]} status={getLinkStatus(4, 3)} />

                        <gridHelper args={[300, 60, '#00ffcc', '#003322']} />
                    </group>
                </Suspense>

                <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} />
            </Canvas>
        </div>
    );
}