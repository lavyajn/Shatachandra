// GridTower.jsx — Tower model per node with status glow + pulsing ring
import { useRef, useState, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import useGridStore from '../../store/useGridStore';
import TowerHUD from './TowerHUD';
import TowerTooltip from './TowerTooltip';
import { STATUS_GLOW_COLORS } from '../../constants/theme';

function TowerModel({ node, position }) {
  let scene;
  let loadError = false;

  try {
    const gltf = useGLTF('/models/power_transmission_tower_free.glb');
    scene = gltf.scene;
  } catch (e) {
    loadError = true;
  }

  const clonedScene = useMemo(() => {
    if (scene) {
      const clone = scene.clone();
      clone.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
        }
      });
      return clone;
    }
    return null;
  }, [scene]);

  if (loadError || !clonedScene) {
    // Fallback cylinder
    return (
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 3, 8]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.4} />
      </mesh>
    );
  }

  return <primitive object={clonedScene} scale={[0.8, 0.8, 0.8]} position={[0, 0, 0]} />;
}

// Wrapper that handles error boundary for GLB loading
function TowerModelSafe({ node, position }) {
  return (
    <Suspense
      fallback={
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.3, 0.5, 3, 8]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.4} />
        </mesh>
      }
    >
      <TowerModel node={node} position={position} />
    </Suspense>
  );
}

export default function GridTower({ node }) {
  const groupRef = useRef();
  const ringRef = useRef();
  const [hovered, setHovered] = useState(false);
  const selectNode = useGridStore((s) => s.selectNode);

  const position = [node.position3D.x, node.position3D.y, node.position3D.z];
  const glowColor = STATUS_GLOW_COLORS[node.status] || STATUS_GLOW_COLORS.normal;
  const glowIntensity = {
    normal: 0.5,
    high: 1.0,
    compromised: 2.0,
    isolated: 0.3,
  }[node.status] || 0.5;

  const loadRatio = Math.min(node.currentLoad / node.capacity, 1.2);

  // Animate pulsing ring and hover scale
  useFrame((state, delta) => {
    if (ringRef.current) {
      const time = state.clock.elapsedTime;
      const pulse = 1.0 + (loadRatio * 0.5) * Math.sin(time * (1 + loadRatio * 3)) * 0.5;
      ringRef.current.scale.set(pulse, pulse, 1);
    }

    if (groupRef.current) {
      const targetScale = hovered ? 1.1 : 1.0;
      const current = groupRef.current.scale.x;
      const lerped = THREE.MathUtils.lerp(current, targetScale, 8 * delta);
      groupRef.current.scale.set(lerped, lerped, lerped);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
      onClick={(e) => { e.stopPropagation(); selectNode(node.id); }}
    >
      {/* GLB Tower or Fallback */}
      <TowerModelSafe node={node} position={position} />

      {/* Status Glow Light */}
      <pointLight
        position={[0, 4, 0]}
        color={glowColor}
        intensity={glowIntensity}
        distance={6}
        decay={2}
      />

      {/* Pulsing Ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
      >
        <torusGeometry args={[0.8, 0.05, 8, 32]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.8}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Always-visible HUD */}
      <TowerHUD node={node} />

      {/* Hover Tooltip */}
      {hovered && <TowerTooltip node={node} />}
    </group>
  );
}
