// TransmissionLine.jsx — Edge with sustained attack colour hold + tween
import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import useGridStore from '../../store/useGridStore';

// Default edge colour
const DEFAULT_COLOR = new THREE.Color('#3b82f6');
const STRESSED_COLOR = new THREE.Color('#f59e0b');
const TWEEN_DURATION_MS = 800;

export default function TransmissionLine({ edge, nodeA, nodeB }) {
  const lineRef = useRef();
  const edgeHighlights = useGridStore((s) => s.edgeHighlights);

  if (!nodeA || !nodeB) return null;

  const posA = [nodeA.position3D.x, 1.5, nodeA.position3D.z];
  const posB = [nodeB.position3D.x, 1.5, nodeB.position3D.z];

  const flowRatio = edge.currentFlow / (edge.baseCapacity || 100);
  const lineWidth = Math.max(0.8, 0.8 + flowRatio * 1.2);

  // Attack state (for particles)
  const isAttacking = nodeA.attackActive || nodeB.attackActive;
  const isIntercepted = nodeA.attackIntercepted || nodeB.attackIntercepted;

  const points = useMemo(() => {
    return [new THREE.Vector3(...posA), new THREE.Vector3(...posB)];
  }, [posA[0], posA[1], posA[2], posB[0], posB[1], posB[2]]);

  // ---- Edge highlight state ----
  // highlight from store: { color, expiresAt } or undefined
  const highlight = edgeHighlights[edge.id];
  const highlightColorRef = useRef(null);
  const tweenStartRef = useRef(null);
  const targetColorRef = useRef(DEFAULT_COLOR.clone());

  // When highlight appears or is removed, manage the colour
  useEffect(() => {
    if (highlight) {
      highlightColorRef.current = new THREE.Color(highlight.color);
      tweenStartRef.current = null; // reset tween
    }
  }, [highlight]);

  // When highlight is cleared, start the tween-back
  useEffect(() => {
    if (!highlight && highlightColorRef.current) {
      tweenStartRef.current = Date.now();
    }
  }, [highlight]);

  useFrame((state) => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material;
    const now = Date.now();

    if (highlight) {
      // During the 2500ms hold period — lock the highlight colour at full opacity
      mat.color.set(highlightColorRef.current);
      mat.opacity = 1.0;
    } else if (tweenStartRef.current && highlightColorRef.current) {
      // Tween back to default over 800ms using linear interpolation
      const elapsed = now - tweenStartRef.current;
      const t = Math.min(elapsed / TWEEN_DURATION_MS, 1.0);

      const defaultCol = edge.stressed ? STRESSED_COLOR : DEFAULT_COLOR;
      const tweenedColor = highlightColorRef.current.clone().lerp(defaultCol, t);
      mat.color.set(tweenedColor);
      mat.opacity = 1.0 - t * 0.4; // Fade from 1.0 to 0.6

      if (t >= 1.0) {
        // Tween complete — clean up
        tweenStartRef.current = null;
        highlightColorRef.current = null;
      }
    } else {
      // No highlight, no tween — normal state
      const baseColor = edge.stressed ? '#f59e0b' : '#3b82f6';
      mat.color.set(baseColor);

      if (isAttacking && !isIntercepted && !highlight) {
        // Subtle pulsing for active attack (when no sustained highlight active)
        const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
        mat.opacity = pulse;
      } else {
        mat.opacity = 0.6;
      }
    }
  });

  // Determine particle colour
  let particleColor = edge.stressed ? '#f59e0b' : '#3b82f6';
  if (highlight) {
    particleColor = highlight.color;
  } else if (isAttacking && !isIntercepted) {
    particleColor = '#ef4444';
  } else if (isIntercepted) {
    particleColor = '#06b6d4';
  }

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color={particleColor}
        lineWidth={highlight ? lineWidth * 2 : lineWidth}
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
        color={particleColor}
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

  useFrame((state) => {
    const t = ((state.clock.elapsedTime * 0.8) % 1);

    if (meshRef.current) {
      if (t < 0.5) {
        // Approaching
        const approach = t * 2;
        meshRef.current.position.x = posA[0] + (posB[0] - posA[0]) * approach * 0.5;
        meshRef.current.position.y = posA[1] + (posB[1] - posA[1]) * approach * 0.5;
        meshRef.current.position.z = posA[2] + (posB[2] - posA[2]) * approach * 0.5;
        meshRef.current.material.opacity = 0.8;
        meshRef.current.scale.setScalar(1);
      } else {
        // Deflecting — scatter outward and fade
        const scatter = (t - 0.5) * 2;
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