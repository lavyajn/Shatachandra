import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

export default function TransmissionLine({ edge, nodeA, nodeB }) {
  const lineRef = useRef();

  if (!nodeA || !nodeB) return null;

  const posA = [nodeA.position3D.x, 1.5, nodeA.position3D.z];
  const posB = [nodeB.position3D.x, 1.5, nodeB.position3D.z];

  // --- REFINED MATH ---
  // Reduced the multiplier from 3 to 1.5 so it doesn't get "fat"
  const flowRatio = edge.currentFlow / (edge.baseCapacity || 100);
  const lineWidth = Math.max(0.8, 0.8 + flowRatio * 1.2); 
  
  const color = edge.stressed ? '#f59e0b' : '#3b82f6'; // Clean Orange / Blue

  const isCompromised = nodeA.status === 2 || nodeB.status === 2 || nodeA.status === 'compromised';

  const points = useMemo(() => {
    return [new THREE.Vector3(...posA), new THREE.Vector3(...posB)];
  }, [posA[0], posA[1], posA[2], posB[0], posB[1], posB[2]]);

  useFrame((state) => {
    if (lineRef.current) {
      if (isCompromised) {
        // High-frequency flicker for compromised nodes
        const flicker = Math.sin(state.clock.elapsedTime * 15) > 0 ? 1.0 : 0.3;
        lineRef.current.material.opacity = flicker;
      } else {
        lineRef.current.material.opacity = 0.6;
      }
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color={color}
        lineWidth={lineWidth}      // Now scales subtly
        transparent
        opacity={0.6}
        dashed
        dashScale={5}              // INCREASED: Makes dots tighter
        dashSize={0.50}            // DECREASED: Makes dots look like pings
        gapSize={0.20}             // DECREASED: Tightens the spacing
      />
      
      {/* Flow particles: Smaller and subtle */}
      <FlowParticle 
        posA={posA} 
        posB={posB} 
        speed={flowRatio * 1.5 + 0.5} 
        color={color} 
      />
    </group>
  );
}

function FlowParticle({ posA, posB, speed, color }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      const t = ((state.clock.elapsedTime * speed * 0.4) % 1);
      meshRef.current.position.x = posA[0] + (posB[0] - posA[0]) * t;
      meshRef.current.position.y = posA[1] + (posB[1] - posA[1]) * t;
      meshRef.current.position.z = posA[2] + (posB[2] - posA[2]) * t;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 6, 6]} /> {/* Smaller particles */}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
        transparent
        opacity={1}
      />
    </mesh>
  );
}