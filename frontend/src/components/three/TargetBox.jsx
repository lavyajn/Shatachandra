// TargetBox.jsx — Target Acquisition Box attack visualization
// Sharp red wireframe bounding box with military HUD corner brackets,
// glitch effects, "BREACH DETECTED" text, and red spotlight
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Build corner bracket geometry — 4 L-shaped brackets at corners of a box
function createCornerBrackets(size, bracketLength) {
  const half = size / 2;
  const bl = bracketLength;
  const positions = [];

  // 8 corners of a cube, each with 3 bracket lines
  const corners = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];

  corners.forEach(([cx, cy, cz]) => {
    const x = cx * half;
    const y = cy * half;
    const z = cz * half;

    // X-axis bracket line
    positions.push(x, y, z, x - cx * bl, y, z);
    // Y-axis bracket line
    positions.push(x, y, z, x, y - cy * bl, z);
    // Z-axis bracket line
    positions.push(x, y, z, x, y, z - cz * bl);
  });

  return new Float32Array(positions);
}

export default function TargetBox({ visible = true }) {
  const groupRef = useRef();
  const bracketsRef = useRef();
  const spotlightRef = useRef();
  const fadeRef = useRef(visible ? 1.0 : 0.0);
  const glitchOffsetRef = useRef(new THREE.Vector3(0, 0, 0));
  const glitchTimerRef = useRef(0);

  // Corner brackets geometry
  const bracketsGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = createCornerBrackets(4.2, 0.8);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Wireframe box edges
  const boxEdgesGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(4.2, 4.2, 4.2);
    return new THREE.EdgesGeometry(box);
  }, []);

  // Targeting reticle — crosshair lines
  const reticleGeo = useMemo(() => {
    const positions = new Float32Array([
      // Horizontal crosshair
      -0.6, 0, 0, -0.2, 0, 0,
      0.2, 0, 0, 0.6, 0, 0,
      // Vertical crosshair
      0, -0.6, 0, 0, -0.2, 0,
      0, 0.2, 0, 0, 0.6, 0,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Smooth fade in/out
    const targetOpacity = visible ? 1.0 : 0.0;
    fadeRef.current = THREE.MathUtils.lerp(fadeRef.current, targetOpacity, delta * 4.0);

    // Glitch effect — intermittent jitter
    glitchTimerRef.current += delta;
    if (glitchTimerRef.current > 0.08) {
      glitchTimerRef.current = 0;
      // 30% chance of glitch each tick
      if (Math.random() < 0.3) {
        glitchOffsetRef.current.set(
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04
        );
      } else {
        glitchOffsetRef.current.set(0, 0, 0);
      }
    }

    // Apply glitch offset to the group
    if (groupRef.current) {
      groupRef.current.position.x = glitchOffsetRef.current.x;
      groupRef.current.position.z = glitchOffsetRef.current.z;
    }

    // Animate bracket lines — subtle pulsing
    if (bracketsRef.current) {
      const pulse = 0.7 + 0.3 * Math.sin(time * 4);
      bracketsRef.current.material.opacity = fadeRef.current * pulse;
    }

    // Update spotlight
    if (spotlightRef.current) {
      spotlightRef.current.intensity = fadeRef.current * 3;
    }
  });

  // Don't render if fully faded out
  if (fadeRef.current < 0.001 && !visible) return null;

  const opacity = fadeRef.current;

  return (
    <group ref={groupRef} position={[0, 1.8, 0]}>
      {/* Wireframe bounding box — dashed red */}
      <lineSegments geometry={boxEdgesGeo}>
        <lineBasicMaterial
          color="#FF2222"
          transparent
          opacity={opacity * 0.4}
          depthWrite={false}
        />
      </lineSegments>

      {/* Corner brackets — bright red, thicker */}
      <lineSegments ref={bracketsRef} geometry={bracketsGeo}>
        <lineBasicMaterial
          color="#FF0000"
          transparent
          opacity={opacity * 0.9}
          depthWrite={false}
          linewidth={2}
        />
      </lineSegments>

      {/* Targeting reticle at center */}
      <lineSegments geometry={reticleGeo} position={[0, 0, 2.2]}>
        <lineBasicMaterial
          color="#FF3333"
          transparent
          opacity={opacity * 0.8}
          depthWrite={false}
        />
      </lineSegments>

      {/* Red spotlight from above */}
      <spotLight
        ref={spotlightRef}
        position={[0, 8, 0]}
        target-position={[0, 0, 0]}
        color="#FF3333"
        intensity={0}
        angle={0.4}
        penumbra={0.6}
        distance={15}
        decay={2}
      />

      {/* Red ambient glow sphere */}
      <mesh>
        <sphereGeometry args={[2.4, 16, 16]} />
        <meshStandardMaterial
          color="#FF0000"
          emissive="#FF0000"
          emissiveIntensity={0.1}
          transparent
          opacity={opacity * 0.04}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* "BREACH DETECTED" holographic text */}
      {opacity > 0.1 && (
        <Html
          position={[0, 2.8, 0]}
          center
          style={{ pointerEvents: 'none' }}
          zIndexRange={[90, 0]}
        >
          <div className="breach-hud" style={{ opacity }}>
            <div className="breach-text">BREACH DETECTED</div>
            <div className="breach-scanline" />
          </div>
        </Html>
      )}
    </group>
  );
}
