import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Effects, shaderMaterial, Float, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, DepthOfField, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CONFIG } from '../../config';
import confetti from 'canvas-confetti';

// ============================================================================
// 🌌 THEME: STARFALL WALTZ × CHERRY BLOSSOM INFINITY
// ============================================================================

const G = {
  deepViolet: '#4a0080',
  indigo: '#1a0a3d',
  rose: '#c2185b',
  champagne: '#f7e7ce',
  gold: '#ffd700',
  white: '#ffffff',
  blush: '#f8bbd0',
};

const safePlay = () => { };



// ============================================================================
// 🌠 LAYER 2: WebGL SOUND & NEBULA SHADER
// ============================================================================
const NebulaMaterial = shaderMaterial(
  { uTime: 0, uResolution: new THREE.Vector2(), uIntensity: 0.0 },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader (Fractal Brownian Motion clouds)
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uIntensity;

    // Simplex noise
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
      m = m*m ;
      m = m*m ;
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

    // FBM
    float fbm(vec2 uv) {
      float sum = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      for(int i = 0; i < 4; i++) {
        sum += snoise(uv * freq) * amp;
        amp *= 0.5;
        freq *= 2.0;
        uv += vec2(100.0, 100.0); // Offset to avoid overlapping patterns perfectly
      }
      return sum;
    }

    void main() {
      // Coordinate mapped to center
      vec2 st = (vUv - 0.5) * vec2(uResolution.x/uResolution.y, 1.0);
      
      // Slow rotation of coordinates over time
      float theta = uTime * 0.02;
      mat2 rot = mat2(cos(theta), -sin(theta), sin(theta), cos(theta));
      st = rot * st;

      // Base noise
      float n1 = fbm(st * 2.0 + uTime * 0.05);
      float n2 = fbm(st * 4.0 - uTime * 0.03 + vec2(n1));
      
      // Radial mask to fade out at edges
      float dist = length(vUv - 0.5);
      float mask = smoothstep(0.6, 0.1, dist);

      // Colors
      vec3 colViolet = vec3(0.29, 0.0, 0.50); // #4a0080
      vec3 colRose = vec3(0.76, 0.1, 0.35);   // #c2185b
      vec3 colChamp = vec3(0.96, 0.90, 0.80); // #f7e7ce
      
      vec3 finalColor = mix(colViolet, colRose, n1 + 0.3);
      finalColor = mix(finalColor, colChamp, n2 * 0.6);
      
      // Density
      float density = smoothstep(-0.2, 0.8, n1 * n2);
      
      gl_FragColor = vec4(finalColor, density * mask * 0.45 * uIntensity);
    }
  `
);
extend({ NebulaMaterial });

const NebulaBackground = ({ intensity }) => {
  const materialRef = useRef();
  const { size } = useThree();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uResolution.set(size.width, size.height);
      // Smoothly approach target intensity
      materialRef.current.uIntensity += (intensity - materialRef.current.uIntensity) * 0.05;
    }
  });

  return (
    <mesh position={[0, 0, -40]} scale={[100, 100, 1]}>
      <planeGeometry args={[1, 1]} />
      <nebulaMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

// ============================================================================
// ✨ WebGL STARFIELD (Static + Orbital Waltz)
// ============================================================================
const StaticStars = ({ opacityTarget }) => {
  const pointsRef = useRef();

  const [positions, colors, phases] = useMemo(() => {
    const p = [], c = [], ph = [];
    const colorGen = new THREE.Color();
    for (let i = 0; i < 1500; i++) {
      // Sphere distribution
      const r = 20 + Math.random() * 60;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      p.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));

      // Slight tint variations
      colorGen.setHSL(0.6 + (Math.random() * 0.1 - 0.05), 0.5, 0.8 + Math.random() * 0.2);
      c.push(colorGen.r, colorGen.g, colorGen.b);

      ph.push(Math.random() * Math.PI * 2);
    }
    return [new Float32Array(p), new Float32Array(c), new Float32Array(ph)];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    const geom = pointsRef.current.geometry;
    const colorsAttr = geom.attributes.color;

    // Twinkle effect modifying color intensity
    for (let i = 0; i < 1500; i++) {
      const p = phases[i];
      const intensity = 0.5 + 0.5 * Math.sin(time * 2.0 + p);
      colorsAttr.setXYZ(i, colors[i * 3] * intensity, colors[i * 3 + 1] * intensity, colors[i * 3 + 2] * intensity);
    }
    colorsAttr.needsUpdate = true;

    // Global fade in
    pointsRef.current.material.opacity += (opacityTarget - pointsRef.current.material.opacity) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={1500} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={1500} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0} sizeAttenuation fog={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

const OrbitalStars = ({ introActive }) => {
  const linesRef = useRef();

  // Create 60 orbital stars
  const starsArray = useMemo(() => {
    return Array.from({ length: 60 }, () => ({
      radius: 10 + Math.random() * 30,
      angle: Math.random() * Math.PI * 2,
      speed: 0.001 + Math.random() * 0.005,
      tiltX: Math.random() * 0.5 - 0.25,
      tiltZ: Math.random() * 0.5 - 0.25,
      history: Array(12).fill(new THREE.Vector3(0, 0, 0)), // Reduced trail length for perf
    }));
  }, []);

  // One geometry handling all segments. 60 stars * 11 segments * 2 points/segment
  const maxLinePoints = 60 * 11 * 2;
  const positions = useMemo(() => new Float32Array(maxLinePoints * 3), []);
  const colors = useMemo(() => new Float32Array(maxLinePoints * 3), []);

  useFrame((state) => {
    if (!linesRef.current || introActive) return; // Don't orbit while intro spiral is happening
    const geom = linesRef.current.geometry;
    const posAttr = geom.attributes.position;
    const colAttr = geom.attributes.color;

    let posIdx = 0;
    let colIdx = 0;

    const colorHead = new THREE.Color(G.gold);
    const colorTail = new THREE.Color(G.champagne);

    starsArray.forEach((star) => {
      // Update position
      star.angle += star.speed;
      const x = Math.cos(star.angle) * star.radius;
      const z = Math.sin(star.angle) * star.radius;

      const v = new THREE.Vector3(x, 0, z);
      v.applyEuler(new THREE.Euler(star.tiltX, 0, star.tiltZ));

      // Shift history
      star.history.unshift(v.clone());
      star.history.pop();

      // Build line segments for rendering
      for (let i = 0; i < 11; i++) {
        const p1 = star.history[i];
        const p2 = star.history[i + 1];
        if (!p1 || !p2) continue;

        posAttr.setXYZ(posIdx++, p1.x, p1.y, p1.z);
        posAttr.setXYZ(posIdx++, p2.x, p2.y, p2.z);

        const alpha1 = 1 - (i / 11);
        const alpha2 = 1 - ((i + 1) / 11);

        const c1 = colorTail.clone().lerp(colorHead, alpha1);
        const c2 = colorTail.clone().lerp(colorHead, alpha2);

        colAttr.setXYZ(colIdx++, c1.r, c1.g, c1.b);
        colAttr.setXYZ(colIdx++, c2.r, c2.g, c2.b);
      }
    });

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={maxLinePoints} array={positions} itemSize={3} usage={THREE.DynamicDrawUsage} />
        <bufferAttribute attach="attributes-color" count={maxLinePoints} array={colors} itemSize={3} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
};

const TwoWaltzStars = ({ active }) => {
  const s1Ref = useRef();
  const s2Ref = useRef();
  const tRef = useRef(0);

  useFrame((state, delta) => {
    if (!active) return;
    tRef.current += delta;
    const t = Math.min(tRef.current / 4.0, 1.0); // 4 second spiral

    // Ease out expo
    const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    if (s1Ref.current && s2Ref.current) {
      // Spiral path 1
      const r1 = 30 * (1 - ease) + 5;
      const a1 = ease * Math.PI * 4;
      s1Ref.current.position.set(Math.cos(a1) * r1, Math.sin(ease * Math.PI) * 4, Math.sin(a1) * r1);

      // Spiral path 2
      const r2 = 30 * (1 - ease) + 5;
      const a2 = ease * Math.PI * 4 + Math.PI;
      s2Ref.current.position.set(Math.cos(a2) * r2, Math.sin(ease * Math.PI) * -4, Math.sin(a2) * r2);

      // Fade out at end
      const alpha = 1 - Math.pow(ease, 8);
      s1Ref.current.material.opacity = alpha;
      s2Ref.current.material.opacity = alpha;
    }
  });

  if (!active) return null;

  return (
    <group>
      <mesh ref={s1Ref}><sphereGeometry args={[0.2, 16, 16]} /><meshBasicMaterial color={G.white} transparent /></mesh>
      <mesh ref={s2Ref}><sphereGeometry args={[0.2, 16, 16]} /><meshBasicMaterial color={G.white} transparent /></mesh>
    </group>
  );
};

// ── LAYER 3.5: GENERATED IMAGE RING ──
const GeneratedRing = ({ state, burstCb }) => {
  const [exploded, setExploded] = useState(false);
  const [hasBurst, setHasBurst] = useState(false);
  const [transparentSrc, setTransparentSrc] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = "/assets/ring_gen.png";
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < 40) data[i + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
      setTransparentSrc(canvas.toDataURL());
    };
  }, []);

  useEffect(() => {
    if (state === 'explode' && !hasBurst) {
      setHasBurst(true);
      setTimeout(() => {
        setExploded(true);
        burstCb();
      }, 100);
    }
  }, [state, hasBurst, burstCb]);

  return (
    <AnimatePresence>
      {!exploded && (
        <motion.div
          key="gen-ring"
          initial={{ opacity: 0, scale: 0, x: '-50%', y: '100%' }}
          animate={{
            opacity: state === 'hidden' ? 0 : 1,
            scale: state === 'explode' ? 2.5 : 1,
            x: '-50%',
            y: state === 'rising' ? ['100%', '-30%'] : state === 'explode' ? '-60%' : '-30%',
            rotate: [0, 3, -3, 0]
          }}
          exit={{ opacity: 0, scale: 2 }}
          transition={{
            y: { type: 'spring', stiffness: 45, damping: 20 },
            rotate: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
            scale: { duration: 0.8 }
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '60%',
            width: 'clamp(120px, 25vw, 175px)',
            zIndex: 40,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 0 30px rgba(255, 180, 200, 0.4)) contrast(1.1)'
          }}
        >
          {transparentSrc && (
            <motion.img
              src={transparentSrc}
              alt="Engagement Ring"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Internal Helper for Diamonds
const DiamondAt = ({ pos, scale }) => (
  <group position={pos} scale={scale}>
    <mesh>
      <cylinderGeometry args={[0.45, 0.1, 0.2, 8]} />
      <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={1} ior={2.4} reflectivity={1} envMapIntensity={6} />
    </mesh>
    <mesh position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[0.45, 0.5, 8]} />
      <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={2} ior={2.4} reflectivity={1} envMapIntensity={6} />
    </mesh>
  </group>
);

// ============================================================================
// 🌸 LAYER 4: CANVAS 2D CHERRY BLOSSOM INFINITY
// ============================================================================
const BezierPetalRain = ({ active, explode }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active && !explode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    window.addEventListener('resize', () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    });

    const colors = ['#fce4ec', '#f8bbd0', '#e8789a', '#ffe0b2', '#f3e5f5', '#fff9c4'];
    const pCount = explode ? 60 : 15;

    const petals = Array.from({ length: pCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h - (explode ? h / 2 : h),
      size: 6 + Math.random() * 16,
      c: colors[Math.floor(Math.random() * colors.length)],
      a: 0.55 + Math.random() * 0.3,
      sy: (explode ? 4 : 0.8) + Math.random() * 2,
      sx: (Math.random() - 0.5) * (explode ? 15 : 1),
      sway: Math.random() * Math.PI * 2,
      sAmp: 30 + Math.random() * 30,
      sFreq: 0.008 + Math.random() * 0.007,
      rot: Math.random() * Math.PI * 2,
      rs: (Math.random() - 0.5) * 0.1,
      gust: 0,
    }));

    let frame = 0;
    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      frame++;

      // Random gust of wind
      if (!explode && frame % 600 === 0) {
        petals.forEach(p => { if (Math.random() > 0.8) p.gust = 2.0; });
      }

      petals.forEach(p => {
        p.sway += p.sFreq;
        p.y += p.sy;

        let cx = p.sx + Math.sin(p.sway) * p.sAmp * 0.05;
        if (p.gust > 0) { cx += 5 * p.gust; p.gust *= 0.95; }
        p.x += cx;

        p.rot += p.rs;

        if (p.y > h + p.size) {
          p.y = -p.size;
          p.x = Math.random() * w;
          if (explode && frame > 200) p.a = 0; // Fade out exploded petals
        }

        if (p.a <= 0) return;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.a;

        // Draw bespoke bezier petal
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.8, -s * 0.5, s * 0.8, s * 0.5, 0, s);
        ctx.bezierCurveTo(-s * 0.8, s * 0.5, -s * 0.8, -s * 0.5, 0, -s);
        ctx.fillStyle = p.c;
        ctx.fill();

        // White vein highlight
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.8);
        ctx.bezierCurveTo(s * 0.2, 0, s * 0.2, s * 0.5, 0, s * 0.8);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = s * 0.1;
        ctx.stroke();

        ctx.restore();
      });
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, explode]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none' }} />;
};

// ============================================================================
// ✍️ LAYER 5: INK ON WATER PROPOSAL TEXT
// ============================================================================
const InkTextReveal = ({ text, active }) => {
  if (!active) return null;

  // Split into characters, preserving word breaks
  const words = text.split(' ');
  let charIdx = 0;

  return (
    <div style={{
      maxWidth: '380px', margin: '0 auto', textAlign: 'center', lineHeight: 1.75,
      textShadow: '0 2px 20px rgba(0,0,0,0.8)'
    }}>
      {words.map((word, wIdx) => {
        return (
          <span key={wIdx} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.4rem' }}>
            {word.split('').map((char, cIdx) => {
              const delay = (charIdx++) * 0.05; // Responds instantly to 'active' state
              return (
                <motion.span
                  key={cIdx}
                  initial={{ opacity: 0, filter: 'blur(12px)', y: 8 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: 'inline-block',
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: 'clamp(1.2rem, 4.2vw, 1.6rem)', // Slightly smaller for better fit
                    fontStyle: 'italic',
                    background: 'linear-gradient(135deg, #ffffff 20%, #ffb6c1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.6,
                    textShadow: '0 0 15px rgba(255,180,200,0.2)'
                  }}
                >
                  {char}
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
};

// ============================================================================
// 🏃 LAYER 5: THE MISCHIEVOUS RUNAWAY "NO" BUTTON
// ============================================================================
const NO_MESSAGES = [
  "My heart only has room for a 'Yes'... ❤️",
  "Are you sure? I built this whole universe for you! ✨",
  "Wait! Let's write our 'Forever' together... 💍",
  "You're the only one I want to walk through life with. 🥰",
  "The stars are literally aligned for us... 🌌",
  "I promise to love you more with every heartbeat! 💓",
  "There is no 'No' in our destiny, my Princess... 💞",
  "I'll keep chasing you until you say Yes! 🏃‍♂️💨",
  "Imagine our life together... it's beautiful! 🏡🌹",
  "I worked so hard on this because you're worth it. 😭❤️",
  "I want to be the one who makes you smile forever. 😊",
  "Just one click to start our greatest adventure! 🚀💍",
  "My life is complete only with you by my side. 👑",
  "I'll never stop loving you, Ritam. 💖"
];

const RunawayNoButton = ({ active }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [attempts, setAttempts] = useState(0);
  const [isButterfly, setIsButterfly] = useState(false);
  const btnRef = useRef();

  if (!active) return null;

  const getSafeDistance = (x, y, btnW, btnH) => {
    let nx = x, ny = y;
    const padX = 120; // Extra horizontal space for messages
    const padY = 150; // Extra vertical space for messages
    const safeW = window.innerWidth - (padX * 2);
    const safeH = window.innerHeight - (padY * 2);

    // Clamp absolute coordinates to the safe central rectangle
    nx = Math.max(padX, Math.min(nx, window.innerWidth - padX - btnW));
    ny = Math.max(padY, Math.min(ny, window.innerHeight - padY - btnH));

    return { x: nx, y: ny };
  };

  const escape = (e) => {
    if (!btnRef.current) return;
    const btn = btnRef.current.getBoundingClientRect();
    const cx = btn.left + btn.width / 2;
    const cy = btn.top + btn.height / 2;

    // Find interaction point (mouse or touch)
    let mx = cx, my = cy;
    if (e.touches && e.touches[0]) { mx = e.touches[0].clientX; my = e.touches[0].clientY; }
    else if (e.clientX) { mx = e.clientX; my = e.clientY; }

    // Directional vector away from cursor
    const dx = cx - mx;
    const dy = cy - my;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Project new point 200px away in the opposite direction
    const rawX = btn.left + (dx / dist) * 200;
    const rawY = btn.top + (dy / dist) * 200;

    const safePos = getSafeDistance(rawX, rawY, btn.width, btn.height);

    // Butterfly logic
    if (attempts >= 4 && Math.random() > 0.7) {
      setIsButterfly(true);
      setTimeout(() => setIsButterfly(false), 600);
    }

    // Calculate precise relative translation required to land on the safe absolute coordinates
    setPos(prev => ({
      x: prev.x + (safePos.x - btn.left),
      y: prev.y + (safePos.y - btn.top)
    }));

    setAttempts(a => a + 1);
  };

  const scale = 1; // Never shrink, stay notorious
  const opcty = 1; // Never fade, stay visible

  return (
    <motion.div
      ref={btnRef}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: opcty,
        scale,
        x: pos.x,
        y: pos.y,
        rotate: attempts > 3 ? (Math.sin(attempts) * 10) : 0 // Gentle wiggle instead of crazy flip
      }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      onMouseEnter={escape} onTouchStart={escape} onClick={(e) => { e.preventDefault(); escape(e); }}
      style={{ position: 'relative', zIndex: 50, padding: '50px', margin: '-50px', cursor: 'default' }}
    >
      {isButterfly ? (
        <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 10px #60efff)' }}>🦋</span>
      ) : (
        <button style={{
          padding: '16px 40px', borderRadius: '50px', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.4)',
          color: 'rgba(255,255,255,0.9)', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem', pointerEvents: 'none'
        }}>No.</button>
      )}

      {/* Floating tease message */}
      <AnimatePresence>
        {attempts > 0 && !isButterfly && (
          <motion.div
            key={attempts}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'clamp(140px, 40vw, 180px)',
              textAlign: 'center',
              color: G.blush,
              fontSize: '13px',
              fontWeight: 500,
              pointerEvents: 'none',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              backgroundColor: 'rgba(0,0,0,0.4)',
              padding: '6px 12px',
              borderRadius: '12px',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,180,200,0.2)'
            }}
          >
            {NO_MESSAGES[Math.min(attempts - 1, NO_MESSAGES.length - 1)]}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// ❤️ LAYER 6: CELEBRATION DECORATIONS
// ============================================================================
const FloatingHearts = ({ active }) => {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 90, overflow: 'hidden' }}>
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: '110vh', x: `${Math.random() * 100}vw`, scale: 0.5 }}
          animate={{
            opacity: [0, 0.8, 0],
            y: '-20vh',
            x: `${(Math.random() * 100) + (Math.random() - 0.5) * 20}vw`,
            scale: [0.5, 1.2, 0.8],
            rotate: Math.random() * 360
          }}
          transition={{
            duration: 6 + Math.random() * 6,
            delay: Math.random() * 8,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ position: 'absolute', fontSize: '1.5rem', filter: 'drop-shadow(0 0 12px rgba(255,100,150,0.4))' }}
        >
          {['❤️', '💖', '💝', '💕', '✨', '🌸'][Math.floor(Math.random() * 6)]}
        </motion.span>
      ))}
    </div>
  );
};

const Sparkles = ({ count = 15 }) => {
  return (
    <div style={{ position: 'absolute', inset: -30, pointerEvents: 'none', zIndex: 101 }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            x: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 250],
            y: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 250],
            rotate: [0, 180]
          }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '3px',
            height: '3px',
            backgroundColor: '#ffd700',
            borderRadius: '50%',
            boxShadow: '0 0 15px #ffd700, 0 0 5px #fff'
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// 🎥 LAYER 3: CAMERA RIGGER (Parallax)
// ============================================================================
const CameraRigger = ({ mouseRef }) => {
  useFrame((state) => {
    state.camera.position.x += (mouseRef.current.x * 0.4 - state.camera.position.x) * 0.05;
    state.camera.position.y += (mouseRef.current.y * 0.3 - state.camera.position.y) * 0.05;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

// ============================================================================
// 🎬 MAIN LAYER COMPOSITOR (Act Component)
// ============================================================================
const Act4Question = ({ onComplete }) => {
  const [seq, setSeq] = useState({
    nebula: 0.1, stars: false, waltz: false, petals: false,
    ring: 'hidden', labels: false, text: false, buttons: false,
    accepted: false
  });

  // Mobile Parallax Ref
  const mouseRef = useRef({ x: 0, y: 0 });
  const timersRef = useRef([]);

  useEffect(() => {
    // Play on first interaction if possible, or just start if autoplay allows.
    // Core Choreography Engine
    timersRef.current = [
      setTimeout(() => setSeq(s => ({ ...s, nebula: 0.4 })), 50),
      setTimeout(() => setSeq(s => ({ ...s, stars: true })), 200),
      setTimeout(() => setSeq(s => ({ ...s, waltz: true })), 400),
      setTimeout(() => setSeq(s => ({ ...s, petals: true })), 600),
      setTimeout(() => setSeq(s => ({ ...s, labels: true })), 400),
      setTimeout(() => setSeq(s => ({ ...s, text: true })), 800),
      setTimeout(() => setSeq(s => ({ ...s, ring: 'rising' })), 13000), // Delayed to T+13s to finish reading
      setTimeout(() => setSeq(s => ({ ...s, ring: 'idle' })), 14000),
      setTimeout(() => setSeq(s => ({ ...s, buttons: true })), 15000),
    ];

    // Mobile Parallax Event
    const handleTilt = (e) => {
      if (e.beta && e.gamma) {
        mouseRef.current = { x: e.gamma / 45, y: (e.beta - 45) / 45 };
      }
    };
    window.addEventListener('deviceorientation', handleTilt);
    const handleMouse = (e) => {
      mouseRef.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 };
    };
    window.addEventListener('mousemove', handleMouse);

    return () => { timersRef.current.forEach(clearTimeout); window.removeEventListener('deviceorientation', handleTilt); window.removeEventListener('mousemove', handleMouse); };
  }, []);

  const handleYesClick = () => {
    timersRef.current.forEach(clearTimeout); // KILL ALL TIMERS so they don't bring buttons back
    setSeq(s => ({ ...s, buttons: false, text: false, labels: false, ring: 'explode', accepted: true }));
    // Flash effect using DOM
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:white;z-index:9999;pointer-events:none;transition:opacity 0.4s;opacity:0.6';
    document.body.appendChild(flash);
    requestAnimationFrame(() => flash.style.opacity = '0');
    setTimeout(() => flash.remove(), 400);

    // Initial Elegant Confetti Burst
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 45,
      colors: [G.gold, G.blush, G.white],
      origin: { y: 0.7 },
      zIndex: 5000
    });
  };

  const handleBurstCb = () => { // Triggered when ring finishes expanding
    // Secondary gentle confetti shower
    const cInterval = setInterval(() => {
      confetti({
        particleCount: 10,
        angle: 90,
        spread: 80,
        origin: { x: Math.random(), y: 0.8 },
        colors: [G.gold, G.rose, G.blush, '#ffffff'],
        gravity: 0.6,
        scalar: 0.8,
        zIndex: 5000
      });
    }, 400);

    // One final celebratory soft burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: [G.rose, G.blush],
        zIndex: 5000,
        scalar: 1.1
      });
    }, 1500);

    setTimeout(() => clearInterval(cInterval), 4000);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: '#050510', overflow: 'hidden' }}>

      {/* ── LAYER 2: Breathing Atmosphere CSS ── */}
      <style>{`
        @keyframes breath { 0% { transform: scale(1); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
        @keyframes goldShimmer { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
      <div style={{
        position: 'absolute', inset: -100, zIndex: 5, animation: 'breath 8s ease-in-out infinite', pointerEvents: 'none',
        background: `radial-gradient(circle at 30% 40%, #3d1a6e 0%, transparent 60%), radial-gradient(circle at 70% 30%, #1a0a3d 0%, transparent 50%), radial-gradient(circle at 50% 80%, #c2185b33 0%, transparent 60%), linear-gradient(180deg, #050510 0%, #150a45 40%, #4a0080 70%, #c2185b 100%)`
      }} />

      {/* ── LAYER 3: R3F World ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }} gl={{ alpha: true, antialias: false, stencil: false, powerPreference: 'high-performance' }}>
          <NebulaBackground intensity={seq.accepted ? 1.0 : seq.nebula} />
          {seq.stars && <StaticStars opacityTarget={1.0} />}
          {seq.stars && <OrbitalStars introActive={seq.waltz && !seq.petals} />} {/* Waltz ends when petals start */}
          {seq.waltz && <TwoWaltzStars active={!seq.petals} />}

          {/* Parallax Camera Group wrapper */}
          <group>
            <CameraRigger mouseRef={mouseRef} />
            {/* 3D Ring Removed - Using High-Quality Generated Image Below */}
          </group>

          {/* EffectComposer removed for stability */}
        </Canvas>
      </div>

      {/* ── LAYER 4: Petal Rain & Generated Ring ── */}
      <BezierPetalRain active={seq.petals} explode={seq.accepted} />
      <GeneratedRing state={seq.ring} burstCb={handleBurstCb} />

      {/* ── LAYER 5: Foreground UI Compositor ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start', gap: '0.2rem', padding: '10dvh 20px 0 20px'
      }}>

        {/* Proposal Info */}
        <AnimatePresence>
          {seq.labels && (
            <motion.div key="proposal-labels" initial={{ opacity: 0, y: -11 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} style={{ textAlign: 'center', marginBottom: '0', marginTop: '0' }}>
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', letterSpacing: '0.4em', textTransform: 'uppercase', color: G.blush, opacity: 0.8, marginBottom: '0.5rem' }}>My Dearest</p>
              <h1 style={{
                fontFamily: '"Sacramento", cursive', fontSize: 'clamp(4rem, 12vw, 5.5rem)', margin: 0, lineHeight: 1, padding: '0 20px',
                background: `linear-gradient(135deg, ${G.gold} 0%, ${G.champagne} 35%, ${G.gold} 65%, ${G.champagne} 100%)`,
                backgroundSize: '200% 200%', animation: 'goldShimmer 3s ease-in-out infinite', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 20px ${G.gold}88)`
              }}>
                {CONFIG.NAME}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ink Text */}
        <AnimatePresence><InkTextReveal active={seq.text} text={CONFIG.PROPOSAL_SENTENCE} /></AnimatePresence>

        {/* Action Buttons */}
        <div style={{ position: 'absolute', bottom: '12%', width: '100%', display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center' }}>
          <AnimatePresence>
            {seq.buttons && !seq.accepted && (
              <motion.div key="yes-button-container" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.6 }} style={{ position: 'relative' }}>
                {/* Hover Ripple Ring Base */}
                <motion.div style={{ position: 'absolute', inset: -10, borderRadius: '60px', border: `1px solid ${G.gold}`, pointerEvents: 'none', opacity: 0 }} whileHover={{ scale: 2.5, opacity: 0, transition: { duration: 0.6 } }} />
                {/* Button */}
                <motion.button
                  onClick={handleYesClick}
                  onHoverStart={() => setSeq(s => ({ ...s, ring: 'hover' }))}
                  onHoverEnd={() => setSeq(s => ({ ...s, ring: 'idle' }))}
                  whileHover={{ scale: 1.07, backgroundColor: 'rgba(180, 20, 80, 0.9)', borderColor: `rgba(255, 215, 0, 0.9)` }}
                  whileTap={{ scale: 0.94 }}
                  animate={{ boxShadow: [`0 0 20px rgba(248,200,212,0.3), 0 0 0px rgba(255,215,0,0)`, `0 0 50px rgba(248,200,212,0.8), 0 0 80px rgba(255,215,0,0.3)`, `0 0 20px rgba(248,200,212,0.3), 0 0 0px rgba(255,215,0,0)`] }}
                  transition={{ boxShadow: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }, scale: { type: 'spring', stiffness: 300, damping: 20 } }}
                  style={{
                    padding: '20px 60px', borderRadius: '50px', background: 'linear-gradient(135deg, rgba(180, 20, 80, 0.75) 0%, rgba(120, 10, 60, 0.75) 100%)',
                    border: '1.5px solid rgba(255, 180, 200, 0.7)', color: '#fff9f0', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.2em', cursor: 'pointer', backdropFilter: 'blur(16px)', zIndex: 51
                  }}
                >
                  Always. 💍
                </motion.button>
              </motion.div>
            )}
            {seq.buttons && !seq.accepted && <RunawayNoButton key="runaway-no-button" active={seq.buttons} />}
          </AnimatePresence>
        </div>

        {/* ── CLIMAX OVERLAY ── */}
        <AnimatePresence>
          {seq.accepted && (
            <motion.div key="climax-celebration-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 1.5 }} style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(74,0,128,0.2) 0%, transparent 70%)' }}>

              {/* Engagement Photo Frame */}
              <motion.div
                key="photo-frame-container"
                initial={{ opacity: 0, scale: 0.5, rotate: -8, y: 20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                transition={{ duration: 1.8, delay: 2.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: 'relative', marginBottom: '2.5rem' }}
              >
                <Sparkles />
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: 'clamp(200px, 45vw, 320px)',
                    aspectRatio: '1/1',
                    borderRadius: '24px',
                    padding: '8px',
                    background: `linear-gradient(135deg, ${G.gold}, ${G.champagne}, ${G.gold})`,
                    boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${G.gold}44`,
                    position: 'relative',
                    zIndex: 102,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ width: '100%', height: '100%', borderRadius: '18px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src="/assets/engaged.jpeg"
                      alt="Engaged"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Glassy overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)', pointerEvents: 'none' }} />
                  </div>
                </motion.div>

                {/* Decorative Ring under frame */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  style={{
                    position: 'absolute', inset: -15, border: `1px dashed ${G.gold}66`, borderRadius: '35%', zIndex: 101
                  }}
                />
              </motion.div>

              <motion.h2
                key="yes-heading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 3.2 }}
                style={{
                  fontFamily: '"Sacramento", cursive', fontSize: 'clamp(3.5rem, 10vw, 5rem)', color: G.gold,
                  filter: `drop-shadow(0 0 15px ${G.gold}88)`, margin: 0, textAlign: 'center'
                }}
              >
                Thank You For Always choosing me my love🎉
              </motion.h2>

              <motion.div
                key="climax-text-group"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 4 }}
                style={{ textAlign: 'center' }}
              >
                <p style={{
                  fontFamily: '"Cormorant Garamond", serif', fontSize: '1.8rem', fontStyle: 'italic',
                  color: G.white, marginTop: '0.5rem', letterSpacing: '0.1em'
                }}>
                  {CONFIG.NAME} {CONFIG.FUTURE_LAST_NAME}
                </p>
                <p style={{
                  fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: G.champagne,
                  maxWidth: '320px', textAlign: 'center', marginTop: '1.2rem', lineHeight: 1.6, opacity: 0.9
                }}>

                </p>
              </motion.div>

              <motion.button
                key="forever-button"
                onClick={onComplete}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 6, duration: 1.5 }}
                whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${G.gold}88` }} whileTap={{ scale: 0.95 }}
                style={{
                  marginTop: '3rem', padding: '15px 50px', borderRadius: '40px', background: 'rgba(20,10,50,0.85)', border: `1px solid ${G.gold}`,
                  color: G.gold, fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(20px)',
                  boxShadow: '0 0 25px rgba(255,215,0,0.3)', fontFamily: 'sans-serif', zIndex: 110
                }}
              >
                Replay this whole wish again
              </motion.button>

              {/* Cinematic Lustre Sweep */}
              <motion.div
                key="lustre-sweep"
                initial={{ left: '-100%' }}
                animate={{ left: '200%' }}
                transition={{ duration: 3, delay: 2, ease: "easeInOut" }}
                style={{
                  position: 'absolute', top: 0, height: '100%', width: '50%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                  transform: 'skewX(-25deg)', pointerEvents: 'none', zIndex: 105
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Floating Hearts */}
        <FloatingHearts active={seq.accepted} />

      </div>
    </div>
  );
};

export default Act4Question;
