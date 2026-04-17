import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

export default function TransmissionLine({ edge, nodeA, nodeB }) {
  const lineRef = useRef();

  if (!nodeA || !nodeB) return null;

  const posA = [nodeA.position3D.x, 1.5, nodeA.position3D.z];
  const posB = [nodeB.position3D.x, 1.5, nodeB.position3D.z];

  const flowRatio = edge.currentFlow / (edge.baseCapacity || 100);
  const lineWidth = Math.max(0.8, 0.8 + flowRatio * 1.2);

  // Color based on attack state
  const isAttacking = nodeA.attackActive || nodeB.attackActive;
  const isIntercepted = nodeA.attackIntercepted || nodeB.attackIntercepted;

  let color = edge.stressed ? '#f59e0b' : '#3b82f6';
  if (isAttacking && !isIntercepted) {
    color = '#ef4444'; // Red for unblocked attack
  } else if (isIntercepted) {
    color = '#06b6d4'; // Cyan for intercepted
  }

  const points = useMemo(() => {
    return [new THREE.Vector3(...posA), new THREE.Vector3(...posB)];
  }, [posA[0], posA[1], posA[2], posB[0], posB[1], posB[2]]);

  useFrame((state) => {
    if (lineRef.current) {
      if (isAttacking && !isIntercepted) {
        // Compromised: subtle pulsing opacity (not harsh flicker)
        const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
        lineRef.current.material.opacity = pulse;
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
        lineWidth={lineWidth}
        transparent
        opacity={0.6}
        dashed
        dashScale={5}
        dashSize={0.50}
        gapSize={0.20}
      />

      {/* Flow particle — directed along edge */}
      <FlowParticle
        posA={posA}
        posB={posB}
        speed={flowRatio * 1.5 + 0.5}
        color={color}
      />

      {/* Defence deflection particle when attack is intercepted */}
      {isIntercepted && (
        <DeflectionParticle
          posA={posA}
          posB={posB}
        />
      )}
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
      <sphereGeometry args={[0.06, 6, 6]} />
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

// Deflection animation — particle approaches but scatters at midpoint
function DeflectionParticle({ posA, posB }) {
  const meshRef = useRef();
  const scatterRef = useRef();

  useFrame((state) => {
    const t = ((state.clock.elapsedTime * 0.8) % 1);

    if (meshRef.current) {
      if (t < 0.5) {
        // Approaching
        const approach = t * 2; // 0 to 1 over first half
        meshRef.current.position.x = posA[0] + (posB[0] - posA[0]) * approach * 0.5;
        meshRef.current.position.y = posA[1] + (posB[1] - posA[1]) * approach * 0.5;
        meshRef.current.position.z = posA[2] + (posB[2] - posA[2]) * approach * 0.5;
        meshRef.current.material.opacity = 0.8;
        meshRef.current.scale.setScalar(1);
      } else {
        // Deflecting — scatter outward and fade
        const scatter = (t - 0.5) * 2; // 0 to 1 over second half
        const midX = (posA[0] + posB[0]) * 0.5;
        const midY = (posA[1] + posB[1]) * 0.5 + scatter * 1.5;
        const midZ = (posA[2] + posB[2]) * 0.5;
        meshRef.current.position.x = midX + Math.sin(state.clock.elapsedTime * 5) * scatter * 0.5;
        meshRef.current.position.y = midY;
        meshRef.current.position.z = midZ + Math.cos(state.clock.elapsedTime * 5) * scatter * 0.5;
        meshRef.current.material.opacity = 0.8 * (1 - scatter);
        meshRef.current.scale.setScalar(1 + scatter * 2);
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial
        color="#00ffcc"
        emissive="#00ffcc"
        emissiveIntensity={4}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}