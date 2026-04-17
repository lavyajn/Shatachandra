// Skybox.jsx — Environment lighting with stars
import { Stars, Environment } from '@react-three/drei';

export default function Skybox() {
  return (
    <>
      <Stars
        radius={80}
        depth={60}
        count={3000}
        factor={4}
        saturation={0.2}
        fade
        speed={0.5}
      />
    </>
  );
}
