import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

// This creates a custom material we can use in React Three Fiber
const AuroraMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color('#4cd137'), // Aurora Mint
    uColor2: new THREE.Color('#9c88ff'), // Twilight Purple
    uColor3: new THREE.Color('#00a8ff'), // Deep Ice Blue
  },
  // VERTEX SHADER: This bends a flat plane into rolling 3D waves
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;

    void main() {
      vUv = uv;
      vPosition = position;
      
      vec3 pos = position;
      // Mathematical poetry: sine waves creating organic movement
      pos.z += sin(pos.x * 2.0 + uTime * 0.4) * 0.4;
      pos.y += cos(pos.z * 1.5 + uTime * 0.2) * 0.2;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // FRAGMENT SHADER: This mixes the colors like liquid ink
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;

    void main() {
      // Create overlapping waves of light
      float wave1 = sin(vUv.x * 8.0 + uTime * 0.8) * 0.5 + 0.5;
      float wave2 = cos(vUv.y * 6.0 - uTime * 0.5) * 0.5 + 0.5;
      float wave3 = sin((vUv.x + vUv.y) * 4.0 + uTime * 0.6) * 0.5 + 0.5;

      // Blend the Northern Lights colors
      vec3 finalColor = mix(uColor1, uColor2, wave1);
      finalColor = mix(finalColor, uColor3, wave2 * wave3);

      // Create a soft vertical fade (the curtain effect)
      float alpha = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
      
      // Output the final glowing pixel
      gl_FragColor = vec4(finalColor, alpha * 0.85);
    }
  `
);

export default AuroraMaterial;
