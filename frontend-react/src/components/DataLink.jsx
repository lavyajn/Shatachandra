import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

export function DataLink({ start, end, status }) {
    const packetRef = useRef();
    
    const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
    const endVec = useMemo(() => new THREE.Vector3(...end), [end]);

    // FIX: Catch both Status 2 (Compromised) and Status 3 (Isolated)
    const linkColor = status >= 2 ? '#ff0000' : status === 1 ? '#ffcc00' : '#00ffcc';

    useFrame(({ clock }) => {
        if (!packetRef.current) return;
        const speed = 1.0; 
        const t = (clock.elapsedTime * speed) % 1; 
        packetRef.current.position.lerpVectors(startVec, endVec, t);
    });

    return (
        <group>
            <Line 
                points={[start, end]} 
                color={linkColor} 
                lineWidth={status >= 2 ? 4 : 2} // Wire gets thicker under attack
                opacity={status >= 2 ? 0.6 : 0.3} 
                transparent 
            />
            
            <mesh ref={packetRef}>
                {/* Packets get larger when carrying malicious payloads */}
                <sphereGeometry args={[status >= 2 ? 1.5 : 0.8, 16, 16]} />
                <meshBasicMaterial color={linkColor} />
            </mesh>
        </group>
    );
}