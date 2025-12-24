import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { IMAGES, TREE_HEIGHT, TREE_RADIUS, COLORS } from '../constants';
import { GestureType } from '../types';
import { useFrame } from '@react-three/fiber';

interface TreePhotosProps {
    gesture: GestureType;
}

const TreePhotos: React.FC<TreePhotosProps> = ({ gesture }) => {
    const [frames, setFrames] = useState<any[]>([]);
    const groupRef = useRef<THREE.Group>(null);

    // Load textures
    useEffect(() => {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');

        const loadPromises = IMAGES.map(src => {
            return new Promise<THREE.Texture | null>((resolve) => {
                loader.load(src, (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.minFilter = THREE.LinearFilter;
                    tex.magFilter = THREE.LinearFilter;
                    tex.generateMipmaps = false; 
                    resolve(tex);
                }, undefined, () => {
                    console.warn(`Failed to load texture: ${src}`);
                    resolve(null);
                });
            });
        });

        Promise.all(loadPromises).then(results => {
            const validTextures = results.filter((t): t is THREE.Texture => t !== null);
            
            // Distribute frames
            const newFrames = validTextures.map((texture, i) => {
                const count = validTextures.length;
                const t = i / count;
                // Vertical distribution: Spread them out nicely along the tree height
                const h = -TREE_HEIGHT/2 + 1.2 + (t * (TREE_HEIGHT - 2.5)); 
                
                // Radius: slightly outside the tree cone
                const coneRadiusAtH = TREE_RADIUS * (1 - (h + TREE_HEIGHT/2)/TREE_HEIGHT);
                const r = coneRadiusAtH + 0.5; 
                
                const theta = i * (Math.PI * 2 / 1.618) * 5; 
                
                const x = r * Math.cos(theta);
                const z = r * Math.sin(theta);
                
                const position = new THREE.Vector3(x, h, z);
                // Look away from center so the photo faces outward
                const lookAt = new THREE.Vector3(x * 2, h, z * 2); 
                
                return { texture, position, lookAt };
            });
            setFrames(newFrames);
        });
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const isTree = gesture === GestureType.FIST || gesture === GestureType.NONE;
        const targetScale = isTree ? 1 : 0;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
        
        frames.forEach((_, i) => {
            const child = groupRef.current?.children[i];
            if (child) {
                // Gentle breeze effect
                child.rotation.z = Math.sin(state.clock.elapsedTime * 1 + i) * 0.05;
            }
        });
    });

    // --- REFINED FRAME DIMENSIONS (Smaller & Delicated) ---
    const SCALE = 0.55; // Global scale factor to shrink them
    const PHOTO_W = 1.0 * SCALE;
    const PHOTO_H = 1.2 * SCALE;
    const FRAME_THICKNESS = 0.08 * SCALE;
    const FRAME_DEPTH = 0.05 * SCALE;

    return (
        <group ref={groupRef}>
            {frames.map((frame, i) => (
                <group key={i} position={frame.position} lookAt={frame.lookAt}>
                    
                    {/* 1. Main Gold Frame (Outer) */}
                    <mesh position={[0, 0, -0.01]}>
                        <boxGeometry args={[PHOTO_W + FRAME_THICKNESS*2, PHOTO_H + FRAME_THICKNESS*2, FRAME_DEPTH]} />
                        <meshStandardMaterial 
                            color={COLORS.gold} 
                            metalness={1} 
                            roughness={0.2} 
                            emissive={COLORS.gold}
                            emissiveIntensity={0.2}
                        />
                    </mesh>

                    {/* 2. Photo Backing (Black board) */}
                    <mesh position={[0, 0, 0.01]}>
                        <planeGeometry args={[PHOTO_W, PHOTO_H]} />
                        <meshBasicMaterial color="#050505" />
                    </mesh>
                    
                    {/* 3. Photo Texture */}
                    <mesh position={[0, 0, 0.02]}>
                        <planeGeometry args={[PHOTO_W - 0.02, PHOTO_H - 0.02]} />
                        <meshBasicMaterial 
                            map={frame.texture} 
                            toneMapped={false} 
                            side={THREE.DoubleSide}
                        />
                    </mesh>

                    {/* 4. Glass Cover (Subtle Reflection) */}
                    <mesh position={[0, 0, 0.03]}>
                        <planeGeometry args={[PHOTO_W, PHOTO_H]} />
                        <meshPhysicalMaterial 
                            transparent 
                            opacity={0.2} 
                            roughness={0} 
                            metalness={0.5}
                            clearcoat={1}
                            color="#ffffff"
                        />
                    </mesh>

                    {/* String/Hook */}
                    <mesh position={[0, PHOTO_H/2 + 0.1, -0.01]}>
                        <cylinderGeometry args={[0.005, 0.005, 0.3]} />
                        <meshBasicMaterial color={COLORS.gold} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

export default TreePhotos;