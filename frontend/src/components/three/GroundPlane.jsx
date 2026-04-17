// GroundPlane.jsx — Map plane with grid texture
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
    ctx.fillStyle = '#0000007c';
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    const gridSize = 32;
    ctx.strokeStyle = '#11ff00';
    ctx.lineWidth = 0.1;
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

    // Accent lines every 4 grid cells
    ctx.strokeStyle = 'rgb(0, 255, 0)';
    ctx.lineWidth = 0.3;
    for (let i = 0; i <= size; i += gridSize * 2) {
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
        opacity={0.9}
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}
