import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, TREE_HEIGHT } from '../constants';
import { GestureType } from '../types';
import { generateOrnamentPositions } from '../services/geometryService';

interface DecorationsProps {
  gesture: GestureType;
}

const DecoratedTree: React.FC<DecorationsProps> = ({ gesture }) => {
  const starRef = useRef<THREE.Group>(null);
  const goldMeshRef = useRef<THREE.InstancedMesh>(null);
  const redMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const isTree = gesture === GestureType.FIST || gesture === GestureType.NONE;

  // Generate Positions and split by color for better material handling
  const { goldOrnaments, redOrnaments } = useMemo(() => {
    const all = generateOrnamentPositions(120); // More baubles
    const gold = [];
    const red = [];
    
    for (const o of all) {
        // Simple check based on color string or random assignment logic from service
        // Service returns COLORS.gold or '#C41E3A'
        if (o.color === COLORS.gold) {
            gold.push(o);
        } else {
            red.push(o);
        }
    }
    return { goldOrnaments: gold, redOrnaments: red };
  }, []);

  // Helper to update instances
  const updateInstances = (mesh: THREE.InstancedMesh | null, data: any[]) => {
      if (!mesh) return;
      const dummy = new THREE.Object3D();
      data.forEach((d, i) => {
          dummy.position.copy(d.pos);
          // Random slight scale variation
          const s = 1.0; 
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
  };

  useEffect(() => {
    updateInstances(goldMeshRef.current, goldOrnaments);
    updateInstances(redMeshRef.current, redOrnaments);
  }, [goldOrnaments, redOrnaments]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    
    // Star Animation
    if (starRef.current) {
        starRef.current.rotation.y = t * 0.5;
        starRef.current.rotation.z = Math.sin(t) * 0.1;
        const targetScale = isTree ? 1 : 0;
        starRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 3);
    }

    // Baubles Scale Animation (Hide when exploded)
    const targetScale = isTree ? 1 : 0;
    if (goldMeshRef.current) {
        goldMeshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
    }
    if (redMeshRef.current) {
        redMeshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
    }
  });

  return (
    <group>
        {/* Environment Decor */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={400} scale={12} size={4} speed={0.3} opacity={0.5} color="#fff" />
        
        {/* Ground Reflection */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -TREE_HEIGHT/2 - 2, 0]}>
            <planeGeometry args={[60, 60]} />
            <meshStandardMaterial 
                color="#001a14" 
                roughness={0.1} 
                metalness={0.6} 
            />
        </mesh>

        {/* The Golden Star */}
        <group position={[0, TREE_HEIGHT/2 + 0.2, 0]} ref={starRef}>
            <pointLight distance={8} intensity={4} color={COLORS.gold} decay={2} />
            <mesh>
                <octahedronGeometry args={[0.45, 0]} />
                <meshStandardMaterial 
                    color={COLORS.gold} 
                    emissive={COLORS.gold} 
                    emissiveIntensity={3} 
                    toneMapped={false} 
                />
            </mesh>
            <mesh rotation={[0,0,Math.PI/4]}>
                <octahedronGeometry args={[0.65, 0]} />
                <meshStandardMaterial 
                    color={COLORS.gold} 
                    wireframe 
                    emissive={COLORS.gold} 
                    emissiveIntensity={1} 
                    toneMapped={false}
                />
            </mesh>
        </group>

        {/* Gold Baubles - High Glow */}
        <instancedMesh ref={goldMeshRef} args={[undefined, undefined, goldOrnaments.length]}>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial 
                color={COLORS.gold}
                emissive={COLORS.gold}
                emissiveIntensity={1.5} // High brightness
                toneMapped={false} // Crucial for bloom
                metalness={0.9}
                roughness={0.1}
            />
        </instancedMesh>

        {/* Red Baubles - High Glow */}
        <instancedMesh ref={redMeshRef} args={[undefined, undefined, redOrnaments.length]}>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial 
                color={'#ff0033'}
                emissive={'#ff0033'}
                emissiveIntensity={2.0} // Very bright ruby red
                toneMapped={false}
                metalness={0.8}
                roughness={0.1}
            />
        </instancedMesh>
    </group>
  );
};

export default DecoratedTree;