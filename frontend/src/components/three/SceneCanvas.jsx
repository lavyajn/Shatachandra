// SceneCanvas.jsx — Main R3F Canvas for 3D View
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import useGridStore from '../../store/useGridStore';
import GridTower from './GridTower';
import TransmissionLine from './TransmissionLine';
import GroundPlane from './GroundPlane';
import Skybox from './Skybox';

export default function SceneCanvas() {
  const nodes = useGridStore((s) => s.nodes);
  const edges = useGridStore((s) => s.edges);

  const getNode = (id) => nodes.find(n => n.id === id);

  return (
    <Canvas
      camera={{ position: [0, 12, 18], fov: 55 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0a0e1a');
        gl.toneMapping = 2; // ACESFilmic
        gl.toneMappingExposure = 1.2;
      }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 5]} intensity={1.2} castShadow />

      {/* Conditional red point lights for compromised nodes */}
      {nodes.filter(n => n.status === 'compromised').map(n => (
        <pointLight
          key={`glow-${n.id}`}
          position={[n.position3D.x, 3, n.position3D.z]}
          color="#ff2244"
          intensity={2}
          distance={5}
          decay={2}
        />
      ))}

      {/* Environment */}
      <Skybox />
      <GroundPlane />

      {/* Controls */}
      <OrbitControls
        maxPolarAngle={Math.PI / 2.2}
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={40}
        zoomSpeed={0.8}
      />

      {/* Transmission Lines */}
      {edges.map(edge => (
        <TransmissionLine
          key={edge.id}
          edge={edge}
          nodeA={getNode(edge.source)}
          nodeB={getNode(edge.target)}
        />
      ))}

      {/* Grid Towers */}
      {nodes.map(node => (
        <GridTower key={node.id} node={node} />
      ))}
    </Canvas>
  );
}
