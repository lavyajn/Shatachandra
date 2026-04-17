// SceneCanvas.jsx — Main R3F Canvas for 3D View
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import useGridStore from '../../store/useGridStore';
import GridTower from './GridTower';
import TransmissionLine from './TransmissionLine';
import GroundPlane from './GroundPlane';

export default function SceneCanvas() {
  const nodes = useGridStore((s) => s.nodes);
  const edges = useGridStore((s) => s.edges);

  const getNode = (id) => nodes.find(n => n.id === id);

  return (
    <Canvas
      camera={{ position: [0, 14, 20], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#060912');
        gl.toneMapping = 2; // ACESFilmic
        gl.toneMappingExposure = 1.1;
      }}
    >
      {/* Single dominant directional light from above-front + low ambient fill */}
      <ambientLight intensity={0.25} color="#b8c4d0" />
      <directionalLight
        position={[5, 25, 10]}
        intensity={1.4}
        castShadow
        color="#e8edf2"
      />

      {/* Environment */}
      <GroundPlane />

      {/* Controls — locked vertical tilt within comfortable range */}
      <OrbitControls
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        enablePan
        enableZoom
        enableRotate
        minDistance={8}
        maxDistance={35}
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
