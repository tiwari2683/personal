import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

const AuroraMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    uIntensity: 1.0,
    // Lush Northern Lights palette
    uColor1: new THREE.Color('#10b981'), // Vibrant Emerald/Mint
    uColor2: new THREE.Color('#8b5cf6'), // Electric Violet
    uColor3: new THREE.Color('#38bdf8'), // Ice Blue
  },
  // VERTEX SHADER
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;

    void main() {
      vUv = uv;
      vPosition = position;
      
      vec3 pos = position;
      
      // Bend the plane massively to create depth (like looking up at the sky curtain)
      float distanceFilter = max(0.0, 1.0 - length(uv - 0.5) * 1.5);
      pos.z += sin(pos.x * 3.0 + uTime * 0.3) * 1.5 * distanceFilter;
      pos.y += cos(pos.z * 2.0 - uTime * 0.2) * 0.5 * distanceFilter;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // FRAGMENT SHADER: High-end FBM Volumetric Aurora
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uIntensity;

    // Fast simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ; m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    // Fractal Brownian Motion (FBM)
    float fbm(vec2 x) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 5; ++i) {
        v += a * snoise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      
      // Animate the UVs upward and sideways (solar wind effect)
      vec2 windUv = uv * 3.0 + vec2(uTime * 0.1, -uTime * 0.15);
      float noise1 = fbm(windUv);
      
      vec2 windUv2 = uv * 5.0 + vec2(-uTime * 0.05, -uTime * 0.2);
      float noise2 = fbm(windUv2 + noise1);
      
      // Combine noises to create sharp "curtain beams" - widened for more presence
      float auroraDist = smoothstep(-0.1, 0.6, noise2 * noise1);
      
      // Vertical streaking effect
      float streaks = snoise(vec2(uv.x * 15.0, uTime * 0.4)) * 0.5 + 0.5;
      auroraDist *= mix(0.4, 1.2, streaks);

      // Color mapping
      vec3 color = mix(uColor1, uColor2, uv.y + noise1 * 0.5);
      color = mix(color, uColor3, noise2);

      // Radial fade out at edges so it looks like a sky dome - widened fade
      float fade = smoothstep(0.6, 0.05, length(uv - 0.5));
      
      // Bottom fade (horizon)
      float horizon = smoothstep(-0.1, 0.4, uv.y);

      float alpha = auroraDist * fade * horizon * uIntensity;
      
      // Add intense emissive glow factor to the color - boosted to 2.2 for "WOW" factor
      gl_FragColor = vec4(color * 2.2, alpha);
    }
  `
);

export default AuroraMaterial;
