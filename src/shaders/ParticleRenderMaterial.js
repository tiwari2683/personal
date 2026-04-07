import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

/**
 * GPGPU Particle Render Material
 * This material reads positions from a texture (uPositions) instead of
 * using standard geometry attributes. This is the "rendering" part of GPGPU.
 */
const ParticleRenderMaterial = shaderMaterial(
  {
    uPositions: null,
    uPointSize: 2.0,
    uOpacity: 1.0,
    uColor: new THREE.Color('#FFD700')
  },
  // VERTEX SHADER: Fetch displacement from the GPGPU texture
  `
    uniform sampler2D uPositions;
    uniform float uPointSize;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      // Fetch the world-space position from the GPGPU texture
      vec3 pos = texture2D(uPositions, vUv).xyz;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Point size attenuation (smaller when further away)
      gl_PointSize = uPointSize * (250.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // FRAGMENT SHADER: Beautiful glowing points
  `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
      // Circular points (standard trick)
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      
      // Glow falloff
      float glow = exp(-dist * 5.0);
      
      gl_FragColor = vec4(uColor, glow * uOpacity);
    }
  `
);

export default ParticleRenderMaterial;
