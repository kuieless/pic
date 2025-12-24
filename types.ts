export enum GestureType {
  NONE = 'NONE',
  FIST = 'FIST',         // Tree (Default)
  OPEN_PALM = 'OPEN_PALM' // Explode + Photo Close-up
}

export interface ParticleData {
  initialPos: [number, number, number];
  color: string;
}

export type Vector3 = [number, number, number];