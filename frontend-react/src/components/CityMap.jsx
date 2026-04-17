import React, { useMemo } from 'react';

// ─── Reusable Tree (trunk + 3 layered cones) ───────────────────────────────
function Tree({ position, scale = 1, leafColor = '#2D6A1F' }) {
    return (
        <group position={position} scale={[scale, scale, scale]}>
            {/* Trunk */}
            <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.28, 0.38, 3, 7]} />
                <meshStandardMaterial color="#6B3A2A" roughness={0.95} />
            </mesh>
            {/* Canopy – bottom */}
            <mesh position={[0, 4.8, 0]} castShadow>
                <coneGeometry args={[2.4, 4, 8]} />
                <meshStandardMaterial color={leafColor} roughness={0.85} />
            </mesh>
            {/* Canopy – mid */}
            <mesh position={[0, 7.2, 0]} castShadow>
                <coneGeometry args={[1.7, 3.2, 8]} />
                <meshStandardMaterial color="#3a8a27" roughness={0.85} />
            </mesh>
            {/* Canopy – tip */}
            <mesh position={[0, 9.2, 0]} castShadow>
                <coneGeometry args={[1.0, 2.4, 8]} />
                <meshStandardMaterial color="#4aa030" roughness={0.85} />
            </mesh>
        </group>
    );
}

// ─── Reusable House (box body + pyramid roof + door + windows) ─────────────
function House({ position, rotation = [0, 0, 0], bodyColor = '#c4a882', roofColor = '#8B3A3A', scale = 1 }) {
    return (
        <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
            {/* Foundation strip */}
            <mesh position={[0, 0.2, 0]} receiveShadow>
                <boxGeometry args={[8.6, 0.4, 10.6]} />
                <meshStandardMaterial color="#777" roughness={0.95} />
            </mesh>
            {/* Walls */}
            <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
                <boxGeometry args={[8, 6.4, 10]} />
                <meshStandardMaterial color={bodyColor} roughness={0.75} />
            </mesh>
            {/* Roof */}
            <mesh position={[0, 7.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[6.6, 3.2, 4]} />
                <meshStandardMaterial color={roofColor} roughness={0.65} />
            </mesh>
            {/* Door */}
            <mesh position={[0, 1.5, 5.02]}>
                <boxGeometry args={[1.4, 2.8, 0.05]} />
                <meshStandardMaterial color="#4a2a0a" roughness={0.85} />
            </mesh>
            {/* Windows */}
            <mesh position={[-2.6, 3.8, 5.02]}>
                <boxGeometry args={[1.6, 1.6, 0.05]} />
                <meshStandardMaterial color="#87CEEB" roughness={0.1} metalness={0.4} />
            </mesh>
            <mesh position={[2.6, 3.8, 5.02]}>
                <boxGeometry args={[1.6, 1.6, 0.05]} />
                <meshStandardMaterial color="#87CEEB" roughness={0.1} metalness={0.4} />
            </mesh>
        </group>
    );
}

// ─── Flat road strip ───────────────────────────────────────────────────────
function Road({ position, rotY = 0, length = 700, width = 8 }) {
    return (
        <mesh
            position={[position[0], 0.01, position[2]]}
            rotation={[-Math.PI / 2, 0, rotY]}
            receiveShadow
        >
            <planeGeometry args={[width, length]} />
            <meshStandardMaterial color="#222" roughness={0.95} />
        </mesh>
    );
}

// ─── CityMap ───────────────────────────────────────────────────────────────
export function CityMap() {

    // Hardcoded positions — no Math.random() on every render
    const leftForest = useMemo(() => [
        [-210, 0, -185], [-192, 0, -162], [-220, 0, -145], [-200, 0, -128],
        [-185, 0, -108], [-215, 0, -90],  [-195, 0, -205], [-225, 0, -168],
        [-178, 0, -135], [-205, 0, -72],  [-218, 0, -55],  [-188, 0, -220],
    ], []);

    const rightForest = useMemo(() => [
        [185, 0, -165], [200, 0, -145], [215, 0, -120], [190, 0, -98],
        [205, 0, -78],  [185, 0, 75],   [200, 0, 100],  [215, 0, 125],
        [190, 0, 150],  [205, 0, 60],   [175, 0, 175],  [210, 0, -52],
    ], []);

    const scattered = useMemo(() => [
        [35, 0, -75],  [-48, 0, 58],  [115, 0, -42], [-98, 0, 28],
        [65, 0, 135],  [-128, 0, -60],[12, 0, 162],  [-62, 0, -115],
        [142, 0, 32],  [-115, 0, 132],[25, 0, -155], [-145, 0, 90],
    ], []);

    const leafColors = ['#1a5c12', '#2D6A1F', '#3a7a24', '#246e18'];

    return (
        <group>

            {/* ───── GROUND ───── */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[700, 700]} />
                <meshStandardMaterial color="#3e6e35" roughness={0.92} />
            </mesh>

            {/* ───── ROAD GRID ───── */}
            {/* Main N–S */}
            <Road position={[0, 0, 0]}    rotY={0}          length={700} width={10} />
            {/* Main E–W */}
            <Road position={[0, 0, 0]}    rotY={Math.PI/2}  length={700} width={10} />
            {/* Secondary N–S */}
            <Road position={[-130, 0, 0]} rotY={0}          length={700} width={6}  />
            <Road position={[130, 0, 0]}  rotY={0}          length={700} width={6}  />
            {/* Secondary E–W */}
            <Road position={[0, 0, -130]} rotY={Math.PI/2}  length={700} width={6}  />
            <Road position={[0, 0, 130]}  rotY={Math.PI/2}  length={700} width={6}  />

            {/* ───── HOUSE CLUSTER — NW ───── */}
            <House position={[-55, 0, -58]} rotation={[0, 0.12, 0]}  bodyColor="#c4a882" roofColor="#8B3A3A" />
            <House position={[-75, 0, -52]} rotation={[0, -0.18, 0]} bodyColor="#b89068" roofColor="#7A2A2A" />
            <House position={[-60, 0, -78]} rotation={[0, 0.05, 0]}  bodyColor="#d4b896" roofColor="#9B4A4A" />
            <House position={[-85, 0, -75]} rotation={[0, 0.3, 0]}   bodyColor="#c0a070" roofColor="#8B3A3A" />

            {/* ───── HOUSE CLUSTER — NE ───── */}
            <House position={[58, 0, -62]}  rotation={[0, Math.PI + 0.1, 0]}  bodyColor="#a09070" roofColor="#8B3A3A" />
            <House position={[78, 0, -52]}  rotation={[0, Math.PI - 0.25, 0]} bodyColor="#c8b090" roofColor="#7A2A2A" />
            <House position={[62, 0, -82]}  rotation={[0, 0.08, 0]}            bodyColor="#b0a080" roofColor="#9B4A4A" />
            <House position={[88, 0, -78]}  rotation={[0, -0.15, 0]}           bodyColor="#caba98" roofColor="#8B3A3A" />

            {/* ───── HOUSE CLUSTER — SE ───── */}
            <House position={[62, 0, 62]}   rotation={[0, Math.PI / 2, 0]}   bodyColor="#c4a882" roofColor="#6B2A2A" />
            <House position={[82, 0, 75]}   rotation={[0, -0.35, 0]}          bodyColor="#d4b896" roofColor="#8B3A3A" />
            <House position={[55, 0, 88]}   rotation={[0, 0.2, 0]}            bodyColor="#baa878" roofColor="#9B4A4A" />
            <House position={[88, 0, 58]}   rotation={[0, 0.5, 0]}            bodyColor="#c8b490" roofColor="#7A2A2A" />

            {/* ───── HOUSE CLUSTER — SW ───── */}
            <House position={[-62, 0, 65]}  rotation={[0, 0.28, 0]}  bodyColor="#b89878" roofColor="#8B3A3A" />
            <House position={[-80, 0, 78]}  rotation={[0, -0.12, 0]} bodyColor="#c8a888" roofColor="#7A2A2A" />
            <House position={[-58, 0, 88]}  rotation={[0, 0.42, 0]}  bodyColor="#d4b496" roofColor="#9B4A4A" />
            <House position={[-85, 0, 60]}  rotation={[0, -0.35, 0]} bodyColor="#b8a480" roofColor="#8B3A3A" />

            {/* ───── LEFT FOREST ───── */}
            {leftForest.map((pos, i) => (
                <Tree
                    key={`lf-${i}`}
                    position={pos}
                    scale={1.1 + (i % 4) * 0.12}
                    leafColor={leafColors[i % leafColors.length]}
                />
            ))}

            {/* ───── RIGHT FOREST ───── */}
            {rightForest.map((pos, i) => (
                <Tree
                    key={`rf-${i}`}
                    position={pos}
                    scale={1.0 + (i % 3) * 0.18}
                    leafColor={leafColors[(i + 2) % leafColors.length]}
                />
            ))}

            {/* ───── SCATTERED TREES ───── */}
            {scattered.map((pos, i) => (
                <Tree
                    key={`sc-${i}`}
                    position={pos}
                    scale={0.9 + (i % 5) * 0.12}
                    leafColor={leafColors[(i + 1) % leafColors.length]}
                />
            ))}

        </group>
    );
}