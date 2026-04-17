import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

export function DataLink({ start, end, status }) {
    const packetRef = useRef();
    
    // Convert array coordinates to Three.js Vectors
    const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
    const endVec = useMemo(() => new THREE.Vector3(...end), [end]);

    // Determine colors based on the C++ Node status
    // 2: Compromised (Red), 1: Warning (Yellow), 0: Normal (Cyan)
    const linkColor = status === 2 ? '#ff0000' : status === 1 ? '#ffcc00' : '#00ffcc';

    // Animate the packet sliding from start to end
    useFrame(({ clock }) => {
        if (!packetRef.current) return;
        
        // Speed multiplier (increase to make packets fly faster)
        const speed = 1.0; 
        const t = (clock.elapsedTime * speed) % 1; // Loops from 0.0 to 1.0
        
        // Lerp calculates the exact position on the line based on 't'
        packetRef.current.position.lerpVectors(startVec, endVec, t);
    });

    return (
        <group>
            {/* The physical wire connecting the towers */}
            <Line 
                points={[start, end]} 
                color={linkColor} 
                lineWidth={2} 
                opacity={0.3} 
                transparent 
            />
            
            {/* The flowing packet */}
            <mesh ref={packetRef}>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshBasicMaterial color={linkColor} />
            </mesh>
        </group>
    );
}