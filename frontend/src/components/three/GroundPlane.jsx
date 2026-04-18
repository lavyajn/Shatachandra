// GroundPlane.jsx — Subtle grid plane at Y=0 for spatial grounding
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

export default function GroundPlane() {
  const meshRef = useRef();

  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark background
    ctx.fillStyle = '#0e173200';
    ctx.fillRect(0, 0, size, size);

    // Subtle grid lines — low opacity, muted color
    const gridSize = 32;
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= size; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Slightly brighter accent lines every 4 cells
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.12)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i <= size; i += gridSize * 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, []);

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={1}
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  );
}
