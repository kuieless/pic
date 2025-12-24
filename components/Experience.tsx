import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import MagicParticles from './MagicParticles';
import DecoratedTree from './Decorations';
import TreePhotos from './TreePhotos';
import { GestureType, Vector3 } from '../types';

interface ExperienceProps {
  gesture: GestureType;
  handPosition: Vector3;
}

const Experience: React.FC<ExperienceProps> = ({ gesture, handPosition }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 11], fov: 45 }}
      // Enable alpha: true to let the CSS background gradient show through
      gl={{ antialias: false, alpha: true, toneMappingExposure: 1.2 }}
      dpr={[1, 2]} 
    >
      {/* Removed <color attach="background" ... /> to allow transparency */}
      
      {/* Cinematic Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#FFD700" distance={20} decay={2} />
      <pointLight position={[-5, 5, -5]} intensity={1} color="#006040" distance={20} decay={2} />
      <spotLight 
        position={[0, 10, 2]} 
        intensity={3} 
        angle={0.6} 
        penumbra={1} 
        color="#fff" 
        castShadow 
      />

      <Suspense fallback={null}>
         {/* Core Particles */}
         <MagicParticles gesture={gesture} handPosition={handPosition} />
         
         {/* Physical Ornaments */}
         <DecoratedTree gesture={gesture} />
         
         {/* Hanging Photos */}
         <TreePhotos gesture={gesture} />
      </Suspense>

      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        minPolarAngle={Math.PI / 2.2} 
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={gesture === GestureType.FIST || gesture === GestureType.NONE}
        autoRotateSpeed={0.4}
        rotateSpeed={0.5}
      />

      {/* Post Processing - Cinematic Look */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
            luminanceThreshold={0.5} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.6}
        />
        <Vignette eskil={false} offset={0.2} darkness={1.1} />
        <ToneMapping adaptive={true} resolution={256} middleGrey={0.6} maxLuminance={16.0} averageLuminance={1.0} adaptationRate={1.0} />
      </EffectComposer>
    </Canvas>
  );
};

export default Experience;