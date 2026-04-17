/* import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function Substation({ position }) {
    const { scene } = useGLTF('/models/substation.glb');
    const clone = useMemo(() => scene.clone(), [scene]);
    
    // Strip the native textures and apply a holographic wireframe 
    useEffect(() => {
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color('#00ffcc'), // Cyber Teal
                    wireframe: true,
                    transparent: true,
                    opacity: 0.15, // Kept low so it acts as a ghost-like background
                    side: THREE.DoubleSide
                });
            }
        });
    }, [clone]);

    // The native model is huge. Scaled down to 0.005.
    return (
        <primitive 
            object={clone} 
            position={position} 
            scale={0.005} 
            rotation={[0, Math.PI / 4, 0]} 
        />
    );
}

useGLTF.preload('/models/substation.glb'); */