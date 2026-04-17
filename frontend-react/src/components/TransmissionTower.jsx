import React, { useEffect, useMemo, useState } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import useStore from '../store/useStore';
import * as THREE from 'three';

const TARGET_HEIGHT = 49;

export function TransmissionTower({ position, nodeId, scale = 1.9 }) {
    const { scene } = useGLTF('/models/power_transmission_tower_free.glb');
    const clone = useMemo(() => scene.clone(), [scene]);
    const [hovered, setHovered] = useState(false);

    const { autoScale, yOffset } = useMemo(() => {
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const tallest = Math.max(size.x, size.y, size.z);
        const sc = tallest > 0 ? (TARGET_HEIGHT / tallest) * scale : scale;
        const yOff = -box.min.y * sc;
        return { autoScale: sc, yOffset: yOff };
    }, [scene, scale]);

    // Pull ALL metrics from the store
    const nodeData = useStore(state => (state.nodes || []).find(n => n.id === nodeId));
    const rawStatus = nodeData?.status ?? 0;  
    const load = nodeData?.load ?? 0;
    const trust = nodeData?.trust ?? 100;

    // ─── THE FIX: INTELLIGENT VISUAL OVERRIDE ───
    // 1. If trust drops below 50, or status is 2/3, force RED.
    // 2. If load spikes above 80, or status is 1, force YELLOW.
    const effectiveStatus = (trust < 50 || rawStatus >= 2) ? 2 : (load > 80 || rawStatus === 1) ? 1 : 0;

    const voltage = (220 - (load * 0.1)).toFixed(1); 
    const freq = (50.00 - (effectiveStatus === 2 ? 0.5 : 0.01)).toFixed(2);
    const temp = (35 + (load * 0.5)).toFixed(1);

    const statusColor = effectiveStatus === 2 ? '#ff3333' : effectiveStatus === 1 ? '#ffcc00' : '#00ffcc';

    useEffect(() => {
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
                child.material.color.set(statusColor);
                child.material.emissive.set(statusColor);
                child.material.emissiveIntensity = effectiveStatus >= 2 ? 2.0 : effectiveStatus === 1 ? 1.0 : 0.2;
            }
        });
        document.body.style.cursor = hovered ? 'pointer' : 'auto';
    }, [effectiveStatus, clone, statusColor, hovered]);

    const beaconY = yOffset + TARGET_HEIGHT + 5;

    return (
        <group 
            position={position}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        >
            <primitive object={clone} scale={autoScale} position={[0, yOffset, 0]} />

            <mesh position={[0, beaconY, 0]}>
                <sphereGeometry args={[effectiveStatus >= 2 ? 2.5 : 1, 16, 16]} />
                <meshBasicMaterial color={statusColor} />
            </mesh>

            {hovered && (
                <Html position={[0, beaconY + 3, 0]} center zIndexRange={[100, 0]}>
                    <div style={{
                        backgroundColor: 'rgba(5, 5, 5, 0.85)',
                        border: `1px solid ${statusColor}`,
                        padding: '6px 10px',
                        borderRadius: '4px',
                        color: statusColor,
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        pointerEvents: 'none',
                        minWidth: '110px',
                        boxShadow: `0 0 10px ${statusColor}40`
                    }}>
                        <strong style={{ display: 'block', borderBottom: `1px solid ${statusColor}`, paddingBottom: '2px', marginBottom: '4px' }}>
                            NODE-{nodeId} [{effectiveStatus >= 2 ? 'CRIT' : effectiveStatus === 1 ? 'WARN' : 'OK'}]
                        </strong>
                        <div>PWR: {voltage} kV</div>
                        <div>FRQ: {freq} Hz</div>
                        <div>LOD: {Math.round(load)} %</div>
                        <div>TMP: {temp} °C</div>
                        <div>TST: {Math.round(trust)} %</div>
                    </div>
                </Html>
            )}
        </group>
    );
}