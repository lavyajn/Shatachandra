import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import useStore from './store/useStore';
import { TransmissionTower } from './components/TransmissionTower';
import { CityMap } from './components/CityMap';

const WS_URL = 'ws://localhost:8080';

export default function App() {
    const updateTelemetry = useStore((state) => state.updateTelemetry);
    const decisionLog    = useStore((state) => state.decisionLog);
    const nodes          = useStore((state) => state.nodes);

    const [readyState, setReadyState] = useState(0);

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
        <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#050505' }}>

            {/* ── HUD overlay ─────────────────────────────────────────── */}
            <div style={{
                position: 'absolute', top: 20, left: 20, zIndex: 10,
                backgroundColor: 'rgba(10,10,10,0.85)', padding: '20px',
                border: '1px solid #333', borderRadius: '8px',
                pointerEvents: 'none',
            }}>
                <h1 style={{ margin: '0 0 10px 0', color: '#00ffcc', fontFamily: 'monospace' }}>
                    SANRAKSHAN COMMAND
                </h1>
                <h3 style={{
                    color: readyState === 1 ? '#00ffcc' : '#ff3333',
                    marginTop: 0, fontFamily: 'monospace',
                }}>
                    DATALINK: {readyState === 1 ? 'ACTIVE' : 'OFFLINE'}
                </h3>
                <div style={{ color: '#ffcc00', maxWidth: '400px', fontFamily: 'monospace' }}>
                    <strong>[PREDICTIVE ENGINE]</strong>
                    <p>{decisionLog}</p>
                </div>
            </div>

            {/* ── 3-D scene ───────────────────────────────────────────── */}
            <Canvas
                shadows
                camera={{
                    position: [0, 120, 220], // high enough to see the full city
                    fov: 50,
                    near: 0.1,
                    far: 2000,
                }}
            >
                <color attach="background" args={['#0a0f1a']} />

                {/* Lighting */}
                <ambientLight intensity={0.45} />
                {/* Key light – warm sun angle */}
                <directionalLight
                    position={[80, 120, 60]}
                    intensity={1.4}
                    color="#fff5e0"
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-camera-left={-300}
                    shadow-camera-right={300}
                    shadow-camera-top={300}
                    shadow-camera-bottom={-300}
                    shadow-camera-far={600}
                />
                {/* Fill light – cool sky */}
                <directionalLight position={[-60, 80, -60]} intensity={0.3} color="#a0c8ff" />

                <Environment preset="night" />

                <Suspense fallback={
                    <Html center>
                        <div style={{ color: '#00ffcc', fontFamily: 'monospace', fontSize: '22px', whiteSpace: 'nowrap' }}>
                            LOADING CITY INFRASTRUCTURE...
                        </div>
                    </Html>
                }>
                    <group>
                        {/* Procedural city (grass, roads, houses, trees) */}
                        <CityMap />

                        {/*
                         * Transmission towers — positioned along the road grid.
                         * The tower GLB is auto-scaled to 30 units tall,
                         * so these positions make sense in scene space.
                         *
                         * X range: ±300  |  Z range: ±300
                         * Towers placed near road intersections / open fields.
                         */}
                        <TransmissionTower nodeId={0} position={[-80, 0, -45]} />
                        <TransmissionTower nodeId={1} position={[-35, 0,  45]} />
                        <TransmissionTower nodeId={2} position={[  0, 0, -20]} />
                        <TransmissionTower nodeId={3} position={[ 50, 0,  55]} />
                        <TransmissionTower nodeId={4} position={[ 88, 0,   0]} />

                        {/* Shadow catcher */}
                        <ContactShadows
                            resolution={1024}
                            scale={350}
                            blur={2.5}
                            opacity={0.55}
                            far={15}
                            color="#000000"
                        />
                    </group>
                </Suspense>

                <OrbitControls
                    makeDefault
                    target={[0, 0, 0]}
                    maxPolarAngle={Math.PI / 2 - 0.05}
                    minDistance={30}
                    maxDistance={600}
                />
            </Canvas>
        </div>
    );
}