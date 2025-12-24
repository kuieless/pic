
import * as THREE from 'three';
import { PARTICLE_COUNT, TREE_HEIGHT, TREE_RADIUS, COLORS } from '../constants';

// Helper: Gaussian-ish random
const randomNormal = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); 
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

// 1. Generate Tree Points (Realistic Fir Tree Structure)
export const generateTreePoints = (): Float32Array => {
  const points = new Float32Array(PARTICLE_COUNT * 3);
  
  // Golden Angle for spiral distribution
  const phi = Math.PI * (3 - Math.sqrt(5)); 

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const yNorm = i / PARTICLE_COUNT; 
    // Y: -half to +half
    const y = (yNorm * TREE_HEIGHT) - (TREE_HEIGHT / 2);
    
    // Base cone radius
    const baseRadius = TREE_RADIUS * (1 - yNorm);

    // --- Branch/Layer Logic ---
    // Create ~12 distinct layers of branches going up the tree
    const layerFrequency = 12;
    
    // Calculate branch extension based on height
    // Math.sin(...) creates the tiers.
    const branchFactor = 0.4 + 0.6 * Math.pow((Math.sin(y * layerFrequency) + 1) / 2, 2);

    // Spiral Angle
    const theta = i * phi;

    // Introduce "Clumping" around specific angles to simulate individual branches within a layer
    const branchCount = 7; // 7 main branches per layer
    const branchClump = 0.8 + 0.2 * Math.cos(theta * branchCount + y * 2);

    // Final Radius
    const r = baseRadius * branchFactor * branchClump + (Math.random() - 0.5) * 0.3;

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);

    points[i * 3] = x;
    points[i * 3 + 1] = y;
    points[i * 3 + 2] = z;
  }
  return points;
};

// 2. Generate Heart Points (Improved Volume)
export const generateHeartPoints = (): Float32Array => {
  const points = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
     let x = 0, y = 0, z = 0;
     let done = false;
     while (!done) {
        x = (Math.random() - 0.5) * 4;
        y = (Math.random() - 0.5) * 4;
        z = (Math.random() - 0.5) * 2; 
        const a = x*x + 2.25*y*y + z*z - 1;
        if (a*a*a - x*x*z*z*z - 0.1125*y*y*z*z*z < 0) {
            done = true;
        }
     }
     points[i * 3] = x * 2.5;
     points[i * 3 + 1] = (y * 2.5) + 1;
     points[i * 3 + 2] = z * 2.5;
  }
  return points;
};

// 3. Generate Text Points
export const generateTextPoints = (text: string): Float32Array => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 500;
  const height = 150;
  canvas.width = width;
  canvas.height = height;

  if (!ctx) return new Float32Array(PARTICLE_COUNT * 3);

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 60px Cinzel'; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const targetPoints: number[] = [];
  
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      if (data[(y * width + x) * 4] > 128) {
        const px = (x / width - 0.5) * 15;
        const py = -(y / height - 0.5) * 4.5;
        const pz = (Math.random() - 0.5) * 0.2;
        targetPoints.push(px, py, pz);
      }
    }
  }

  const arr = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const srcIdx = i % (targetPoints.length / 3);
    arr[i * 3] = targetPoints[srcIdx * 3];
    arr[i * 3 + 1] = targetPoints[srcIdx * 3 + 1];
    arr[i * 3 + 2] = targetPoints[srcIdx * 3 + 2];
  }
  return arr;
};

// 4. Colors - Richer Emerald & Gold
export const generateColors = (): Float32Array => {
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  
  const cDark = new THREE.Color(COLORS.emeraldDark);
  const cEmerald = new THREE.Color(COLORS.emerald);
  const cLight = new THREE.Color(COLORS.emeraldLight); // New highlight color
  const cGold = new THREE.Color(COLORS.gold);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
     let c = new THREE.Color();
     const r = Math.random();
     
     if (r > 0.96) {
         c.copy(cGold); // Sparkles
     } else if (r > 0.75) {
         c.copy(cLight); // Bright tips (20%)
     } else if (r > 0.3) {
         c.copy(cEmerald); // Main body (45%)
     } else {
         c.copy(cDark); // Depth (30%)
     }
     
     colors[i * 3] = c.r;
     colors[i * 3 + 1] = c.g;
     colors[i * 3 + 2] = c.b;
  }
  return colors;
};

// 5. Generate positions for Hanging Photos and Ornaments
export const generateOrnamentPositions = (count: number) => {
    const data = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    
    for (let i = 0; i < count; i++) {
        const yNorm = i / count;
        const y = ((yNorm * 0.8 + 0.1) * TREE_HEIGHT) - (TREE_HEIGHT / 2);
        
        // Match the Tree Shape logic for placement
        const layerFrequency = 12;
        const branchFactor = 0.4 + 0.6 * Math.pow((Math.sin(y * layerFrequency) + 1) / 2, 2);
        
        // Place ornaments on the "Tips" of the branches
        const baseRadius = TREE_RADIUS * (1 - (y + TREE_HEIGHT/2)/TREE_HEIGHT);
        const r = baseRadius * branchFactor * 0.95; 

        const theta = i * phi * 13; 
        
        // Add random color: Gold, Red
        const rand = Math.random();
        let color = COLORS.gold;
        if(rand > 0.6) color = '#D6001C'; 

        data.push({
            pos: new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)),
            color: color
        });
    }
    return data;
};
