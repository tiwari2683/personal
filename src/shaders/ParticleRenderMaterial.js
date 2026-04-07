import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

const ParticleRenderMaterial = shaderMaterial(
  {
    uPositions: null,
    uPointSize: 1.0,
    uColor: new THREE.Color('#FFD700'),
    uOpacity: 1.0,
    uTime: 0
  },
  // VERTEX SHADER
  `
    uniform sampler2D uPositions;
    uniform float uPointSize;
    uniform float uTime;
    varying vec2 vUv;
    varying float vDistance;

    void main() {
      vUv = uv;
      // Fetch position from simulation texture
      vec3 pos = texture2D(uPositions, uv).xyz;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Points get smaller as they move away (size attenuation)
      gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
      
      // Pass distance for fading
      vDistance = length(pos);
    }
  `,
  // FRAGMENT SHADER
  `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTime;
    varying vec2 vUv;
    varying float vDistance;

    void main() {
      // Circular point with soft edge
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      
      float alpha = (1.0 - dist * 2.0) * uOpacity;
      
      // Add a subtle flicker
      float flicker = 0.8 + 0.2 * sin(uTime * 10.0 + vUv.x * 100.0);
      
      gl_FragColor = vec4(uColor, alpha * flicker);
    }
  `
);

export default ParticleRenderMaterial;
