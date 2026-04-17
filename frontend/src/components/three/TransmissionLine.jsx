// TransmissionLine.jsx — Animated connection lines between nodes
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

export default function TransmissionLine({ edge, nodeA, nodeB }) {
  const lineRef = useRef();
  const dashOffsetRef = useRef(0);

  if (!nodeA || !nodeB) return null;

  const posA = [nodeA.position3D.x, 1.5, nodeA.position3D.z];
  const posB = [nodeB.position3D.x, 1.5, nodeB.position3D.z];

  const flowRatio = edge.currentFlow / edge.baseCapacity;
  const lineWidth = Math.max(1, 1 + flowRatio * 3);
  const color = edge.stressed ? '#ff4400' : '#00aaff';

  const isCompromised = nodeA.status === 'compromised' || nodeB.status === 'compromised';

  const points = useMemo(() => {
    return [new THREE.Vector3(...posA), new THREE.Vector3(...posB)];
  }, [posA[0], posA[1], posA[2], posB[0], posB[1], posB[2]]);

  // We'll use a basic line with animated opacity for flicker effect
  useFrame((state) => {
    if (lineRef.current) {
      if (isCompromised) {
        const flicker = Math.sin(state.clock.elapsedTime * 8 * Math.PI) > 0 ? 1.0 : 0.4;
        lineRef.current.material.opacity = flicker;
      } else {
        lineRef.current.material.opacity = 0.8;
      }
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={0.8}
        dashed
        dashScale={2}
        dashSize={0.5}
        gapSize={0.3}
      />
      {/* Flow particles along the line */}
      <FlowParticle posA={posA} posB={posB} speed={flowRatio * 2 + 0.5} color={color} />
    </group>
  );
}

function FlowParticle({ posA, posB, speed, color }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      const t = ((state.clock.elapsedTime * speed * 0.3) % 1);
      meshRef.current.position.x = posA[0] + (posB[0] - posA[0]) * t;
      meshRef.current.position.y = posA[1] + (posB[1] - posA[1]) * t;
      meshRef.current.position.z = posA[2] + (posB[2] - posA[2]) * t;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
