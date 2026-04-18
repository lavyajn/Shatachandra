// AegisShield.jsx — Aegis Shield defense visualization
// Semi-transparent hexagonal wireframe sphere with rotating digital rings
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom hex-grid shader for the shield surface
const shieldVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const shieldFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    // Fresnel effect — edges glow brighter
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

    // Gradient between two cyan-blue shades based on height
    float gradientT = (vPosition.y + 1.0) * 0.5;
    vec3 color = mix(uColor2, uColor1, gradientT);

    // Pulsing glow
    float pulse = 0.85 + 0.15 * sin(uTime * 1.5);

    // Combine fresnel glow with base transparency
    float alpha = (0.12 + fresnel * 0.35) * pulse * uOpacity;

    gl_FragColor = vec4(color * (1.0 + fresnel * 0.6), alpha);
  }
`;

// Ring shader for the rotating equatorial ring
const ringVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    // Segmented ring pattern
    float segments = 32.0;
    float seg = fract(vUv.x * segments + uTime * 0.3);
    float pattern = step(0.15, seg) * step(seg, 0.85);

    // Scanline brightness variation
    float scan = 0.7 + 0.3 * sin(vUv.x * 64.0 + uTime * 2.0);

    vec3 color = vec3(0.0, 0.85, 1.0);
    float alpha = pattern * scan * 0.6 * uOpacity;

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function AegisShield({ visible = true }) {
  const groupRef = useRef();
  const shieldMatRef = useRef();
  const wireMatRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ringMat1Ref = useRef();
  const ringMat2Ref = useRef();
  const fadeRef = useRef(visible ? 1.0 : 0.0);

  // Shield sphere geometry — IcosahedronGeometry for hex-like pattern
  const { shieldGeo, wireGeo } = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(2.2, 2);
    const wire = new THREE.WireframeGeometry(ico);
    return { shieldGeo: ico, wireGeo: wire };
  }, []);

  // Shader materials
  const shieldMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: shieldVertexShader,
      fragmentShader: shieldFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uColor1: { value: new THREE.Color('#00D9FF') },
        uColor2: { value: new THREE.Color('#0099CC') },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const wireMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: new THREE.Color('#00D9FF'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const ringMaterial1 = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: ringVertexShader,
      fragmentShader: ringFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const ringMaterial2 = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: ringVertexShader,
      fragmentShader: ringFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Smooth fade in/out (0.5s transition)
    const targetOpacity = visible ? 1.0 : 0.0;
    fadeRef.current = THREE.MathUtils.lerp(fadeRef.current, targetOpacity, delta * 4.0);
    const opacity = fadeRef.current;

    // Update shield shader
    shieldMaterial.uniforms.uTime.value = time;
    shieldMaterial.uniforms.uOpacity.value = opacity;

    // Update wireframe opacity
    wireMaterial.opacity = opacity * 0.2;

    // Rotate the shield slowly
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.08;
    }

    // Rotate rings — equatorial orbit at 10-15 sec/revolution
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * (2 * Math.PI / 12); // 12 sec/rev
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * (2 * Math.PI / 15); // 15 sec/rev, opposite
    }

    // Update ring materials
    ringMaterial1.uniforms.uTime.value = time;
    ringMaterial1.uniforms.uOpacity.value = opacity;
    ringMaterial2.uniforms.uTime.value = time * 1.3;
    ringMaterial2.uniforms.uOpacity.value = opacity;
  });

  // Don't render at all if fully faded
  if (fadeRef.current < 0.001 && !visible) return null;

  return (
    <group ref={groupRef} position={[0, 1.8, 0]}>
      {/* Main shield sphere — transparent with hex shader */}
      <mesh geometry={shieldGeo} material={shieldMaterial} />

      {/* Wireframe overlay — hex grid effect */}
      <lineSegments geometry={wireGeo} material={wireMaterial} />

      {/* Equatorial ring 1 — horizontal orbit */}
      <mesh
        ref={ring1Ref}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[2.5, 0.03, 8, 64]} />
        <primitive object={ringMaterial1} attach="material" />
      </mesh>

      {/* Equatorial ring 2 — tilted orbit */}
      <mesh
        ref={ring2Ref}
        rotation={[Math.PI / 2, Math.PI / 6, 0]}
      >
        <torusGeometry args={[2.7, 0.025, 8, 64]} />
        <primitive object={ringMaterial2} attach="material" />
      </mesh>

      {/* Inner glow sphere */}
      <mesh>
        <sphereGeometry args={[2.0, 16, 16]} />
        <meshStandardMaterial
          color="#00D9FF"
          emissive="#00D9FF"
          emissiveIntensity={0.15}
          transparent
          opacity={fadeRef.current * 0.06}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
