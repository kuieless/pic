import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateTreePoints, generateColors } from '../services/geometryService';
import { GestureType, Vector3 } from '../types';
import { PARTICLE_COUNT } from '../constants';

interface MagicParticlesProps {
  gesture: GestureType;
  handPosition: Vector3; // Normalized -1 to 1
}

const MagicParticles: React.FC<MagicParticlesProps> = ({ gesture, handPosition }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Memoize geometries
  const treePos = useMemo(() => generateTreePoints(), []);
  const colors = useMemo(() => generateColors(), []);
  
  // Current positions array (for interpolation)
  const currentPositions = useMemo(() => new Float32Array(treePos), [treePos]);
  
  // Velocities for "Open" state
  const velocities = useMemo(() => {
    const v = new Float32Array(PARTICLE_COUNT * 3);
    for(let i=0; i<v.length; i++) v[i] = (Math.random() - 0.5) * 0.15;
    return v;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();

    // Determine target based on gesture
    // For this specific request, we only have TREE or EXPLOSION.
    // If gesture is FIST/NONE -> Target is treePos.
    const target = treePos;
    
    // Smoothing factor
    let lerpFactor = 0.08;

    if (gesture === GestureType.OPEN_PALM) {
      // Explosion / Snow effect
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Add velocity
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];
        
        // Loop particles to create a snow globe effect when exploded
        if (positions[i*3+1] < -6) positions[i*3+1] = 10;
        if (positions[i*3+1] > 12) positions[i*3+1] = -5;
        
        // Add gentle swirl
        positions[i*3] += Math.sin(time + positions[i*3+1]) * 0.02;
      }
    } else {
      // Form the Tree
      // We do NOT add handPosition offset to the target to ensure the tree is stable.
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const tx = target[i * 3];
        const ty = target[i * 3 + 1];
        const tz = target[i * 3 + 2];

        // Robust Lerp to home position
        positions[i * 3] += (tx - positions[i * 3]) * lerpFactor;
        positions[i * 3 + 1] += (ty - positions[i * 3 + 1]) * lerpFactor;
        positions[i * 3 + 2] += (tz - positions[i * 3 + 2]) * lerpFactor;
        
        // Minimal gentle shimmer, NO heavy breathing/shaking
        // Only very slight wind effect on the outer edges
        const noise = Math.sin(time * 1.5 + ty) * 0.002;
        positions[i*3] += noise;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={currentPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

export default MagicParticles;