import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import useStore from '../store/useStore';
import * as THREE from 'three';

// Target visual height of every tower in scene units (tweak to taste)
const TARGET_HEIGHT = 30;

export function TransmissionTower({ position, nodeId, scale = 1.9 }) {

    const { scene } = useGLTF('/models/power_transmission_tower_free.glb');
    const clone = useMemo(() => scene.clone(), [scene]);

    // ── Auto-scale so tower always hits TARGET_HEIGHT regardless of GLB units ──
    const { autoScale, yOffset } = useMemo(() => {
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const tallest = Math.max(size.x, size.y, size.z);
        const sc = tallest > 0 ? (TARGET_HEIGHT / tallest) * scale : scale;
        // Push model up so its bottom sits exactly on y = 0
        const yOff = -box.min.y * sc;
        return { autoScale: sc, yOffset: yOff };
    }, [scene, scale]);

    // ── Live status from C++ WebSocket feed ────────────────────────────────────
    const nodeData = useStore(state => (state.nodes || []).find(n => n.id === nodeId));
    const status = nodeData?.status ?? 0;  // 0=normal 1=warning 2=compromised 3=isolated

    const statusColor = useMemo(() => {
        if (status === 2 || status === 3) return '#ff0000';
        if (status === 1)                 return '#ffcc00';
        return '#00ffcc';
    }, [status]);

    // ── Tint all meshes in the clone ───────────────────────────────────────────
    useEffect(() => {
        clone.traverse((child) => {
            if (!child.isMesh) return;
            child.material = child.material.clone();
            child.material.color.set(statusColor);
            child.material.emissive.set(statusColor);
            child.material.emissiveIntensity = status === 2 || status === 3 ? 2.0
                                             : status === 1                 ? 1.0
                                             :                                0.2;
            child.castShadow = true;
        });
    }, [status, clone, statusColor]);

    // Status beacon sits just above the tallest point of the tower
    const beaconY = yOffset + TARGET_HEIGHT + 5;

    return (
        <group position={position}>
            {/* The actual GLB — grounded and consistently sized */}
            <primitive object={clone} scale={autoScale} position={[0, yOffset, 0]} />

            {/* Floating status sphere */}
            <mesh position={[0, beaconY, 0]}>
                <sphereGeometry args={[status === 2 ? 2 : 1, 16, 16]} />
                <meshBasicMaterial color={statusColor} />
            </mesh>

            {/* Subtle glow ring on the ground under the tower */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[4, 6, 32]} />
                <meshBasicMaterial
                    color={statusColor}
                    transparent
                    opacity={status === 2 ? 0.6 : 0.15}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

useGLTF.preload('/models/power_transmission_tower_free.glb');