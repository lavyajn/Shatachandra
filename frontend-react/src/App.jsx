import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import useStore from './store/useStore';
import { TransmissionTower } from './components/TransmissionTower';
import { DataLink } from './components/DataLink';
//import { Substation } from './components/CyberEnvironment';

const WS_URL = 'ws://localhost:8080';

// Centralize our tower coordinates so we can draw data links between them
const TOWER_POSITIONS = {
    0: [-50, 0, -30],
    1: [-20, 0,  40],
    2: [  0, 0, -10], // The target node
    3: [ 30, 0,  30],
    4: [ 60, 0, -20]
};

export default function App() {
    const updateTelemetry = useStore((state) => state.updateTelemetry);
    const decisionLog    = useStore((state) => state.decisionLog);
    const nodes          = useStore((state) => state.nodes || []);

    const [readyState, setReadyState] = useState(0);

    // Native WebSocket Connection
    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        ws.onopen    = () => setReadyState(1);
        ws.onclose   = () => setReadyState(0);
        ws.onmessage = (event) => {
            try   { updateTelemetry(JSON.parse(event.data)); }
            catch { console.log('Waiting for valid JSON stream...'); }
        };
        return () => ws.close();
    }, [updateTelemetry]);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#050505', color: '#00ffcc', fontFamily: 'monospace' }}>

            {/* ── LAYER 1: TACTICAL SCADA DASHBOARD ───────────────────────── */}\n            <div style={{
                position: 'absolute', top: 20, left: 20, zIndex: 10,
                backgroundColor: 'rgba(5, 5, 5, 0.9)', padding: '20px', 
                border: '1px solid #00ffcc', borderRadius: '4px',
                pointerEvents: 'none', width: '350px'
            }}>
                <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>SANRAKSHAN ENGINE</h1>
                <h3 style={{ color: readyState === 1 ? '#00ffcc' : '#ff3333', marginTop: 0 }}>
                    DATALINK: {readyState === 1 ? 'ACTIVE' : 'OFFLINE'}
                </h3>
                
                {/* Event Log */}
                <div style={{ backgroundColor: '#111', borderLeft: '3px solid #ffcc00', padding: '10px', marginBottom: '20px', color: '#ffcc00' }}>
                    <strong>[LATEST C++ PREDICTION]</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', lineHeight: '1.4' }}>{decisionLog}</p>
                </div>

                {/* Live Node Telemetry */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <strong style={{ borderBottom: '1px solid #333', paddingBottom: '4px' }}>LIVE NODE METRICS</strong>
                    {nodes.map(node => (
                        <div key={node.id} style={{ 
                            display: 'flex', justifyContent: 'space-between', 
                            color: node.status === 2 ? '#ff3333' : node.status === 1 ? '#ffcc00' : '#00ffcc',
                            backgroundColor: node.status === 2 ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
                            padding: '4px'
                        }}>
                            <span>N-{node.id}</span>
                            <span>Load: {Math.round(node.load || 0)}</span>
                            <span>Trust: {Math.round(node.trust || 100)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── LAYER 2: WebGL GRID ─────────────────────────────────────── */}
            <Canvas camera={{ position: [0, 60, 100], fov: 45 }}>
                <color attach="background" args={['#020202']} />
                <ambientLight intensity={0.3} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />
                <Environment preset="night" />

                <Suspense fallback={
                    <Html center>
                        <div style={{ color: '#00ffcc', fontSize: '24px' }}>CONNECTING TO BACKEND...</div>
                    </Html>
                }>
                    <group position={[0, -10, 0]}>
                        
                        {/* 0. CYBER CITY ENVIRONMENT */}
                        {/* Central Holographic Substation */}
                        {/* <Substation position={[0, 0, -50]} /> */}

                        {/* 1. RENDER THE TOWERS */}
                        {Object.entries(TOWER_POSITIONS).map(([id, pos]) => (
                            <TransmissionTower key={`tower-${id}`} nodeId={parseInt(id)} position={pos} scale={0.7} />
                        ))}
                        
                        {/* ... keep the DataLinks and shadows exactly as they are ... */}

                        {/* 2. RENDER THE DATA PACKET FLOWS */}
                        {/* Connecting Node 0 to Node 2 */}
                        <DataLink start={TOWER_POSITIONS[0]} end={TOWER_POSITIONS[2]} status={nodes.find(n => n.id === 0)?.status} />
                        {/* Connecting Node 1 to Node 2 */}
                        <DataLink start={TOWER_POSITIONS[1]} end={TOWER_POSITIONS[2]} status={nodes.find(n => n.id === 1)?.status} />
                        {/* Connecting Node 3 to Node 2 */}
                        <DataLink start={TOWER_POSITIONS[3]} end={TOWER_POSITIONS[2]} status={nodes.find(n => n.id === 3)?.status} />
                        {/* Connecting Node 4 to Node 3 */}
                        <DataLink start={TOWER_POSITIONS[4]} end={TOWER_POSITIONS[3]} status={nodes.find(n => n.id === 4)?.status} />

                        {/* Shadow catcher for depth */}
                        <ContactShadows resolution={1024} scale={200} blur={2} opacity={0.4} far={15} color="#00ffcc" />
                        
                        {/* A high-tech grid floor */}
                        <gridHelper args={[200, 40, '#00ffcc', '#003322']} />
                    </group>
                </Suspense>

                <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} />
            </Canvas>
        </div>
    );
}