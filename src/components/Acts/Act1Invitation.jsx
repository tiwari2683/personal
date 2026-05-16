import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { CONFIG } from '../../config';

import AuroraMaterial from '../../shaders/AuroraMaterial';
extend({ AuroraMaterial });

// ----------------------------------------------------------------------
// 1. CINEMATIC CAMERA RIG (The "Expensive" Feel)
// ----------------------------------------------------------------------
const CinematicCameraRig = () => {
  const { camera, pointer } = useThree();
  const vec = new THREE.Vector3();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breatheY = Math.sin(t * 0.3) * 0.4;

    // Smooth parallax reacting to the mouse/touch
    const targetX = pointer.x * 3;
    const targetY = pointer.y * 2 + breatheY;

    camera.position.lerp(vec.set(targetX, targetY, 8), 0.02);
    camera.lookAt(0, 0, -10);
  });

  return null;
};

// ----------------------------------------------------------------------
// 2. REALISTIC TWINKLING STARS
// ----------------------------------------------------------------------
const CinematicStars = () => {
  const pointsRef = useRef();
  const count = 2500;

  const [positions, phases, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Deep hemisphere projection
      const r = 50 + Math.random() * 80;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 10;
      pos[i * 3 + 2] = r * Math.cos(phi) - 30;

      phase[i] = Math.random() * Math.PI * 2;
      size[i] = Math.random() * 1.5 + 0.5;
    }
    return [pos, phase, size];
  }, []);

  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float phase;
        attribute float size;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          vAlpha = 0.5 + 0.5 * sin(uTime * 2.0 + phase);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (150.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float ll = length(xy);
          if(ll > 0.5) discard;
          vec3 color = mix(vec3(1.0, 0.95, 0.8), vec3(0.8, 0.9, 1.0), ll * 2.0);
          gl_FragColor = vec4(color, vAlpha * (1.0 - ll * 2.0) * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.002;
    }
  });

  return (
    <points ref={pointsRef} material={starMaterial}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-phase" count={count} array={phases} itemSize={1} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
    </points>
  );
};

// ----------------------------------------------------------------------
// 3. GLOWING STARDUST (Ambient Foreground Particles)
// ----------------------------------------------------------------------
const StardustPath = () => {
  const pointsRef = useRef();
  const count = 400;

  const [positions, speeds, swayOffsets, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const sway = new Float32Array(count);
    const scl = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 30 - 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
      spd[i] = 0.2 + Math.random() * 0.5;
      sway[i] = Math.random() * Math.PI * 2;
      scl[i] = Math.random() * 0.08 + 0.02;
    }
    return [pos, spd, sway, scl];
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      // Slow upward drift like embers
      pos[i * 3 + 1] += speeds[i] * delta * 0.5;
      pos[i * 3] += Math.sin(time * 0.5 + swayOffsets[i]) * 0.01;
      pos[i * 3 + 2] += Math.cos(time * 0.3 + swayOffsets[i]) * 0.01;

      if (pos[i * 3 + 1] > 15) {
        pos[i * 3 + 1] = -15;
        pos[i * 3] = (Math.random() - 0.5) * 40;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffd700" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation={true} />
    </points>
  );
};

// ----------------------------------------------------------------------
// 4. THE LIVING AURORA DOME
// ----------------------------------------------------------------------
const LivingAurora = ({ fadeOutTarget }) => {
  const materialRef = useRef();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      // Smoothly fade out when transitioning
      materialRef.current.uIntensity += (fadeOutTarget - materialRef.current.uIntensity) * 0.05;
    }
  });

  return (
    <group>
      {/* The Sky Canvas - Scaled up for more immersion */}
      <mesh position={[0, -5, -30]} scale={[120, 80, 1]}>
        <planeGeometry args={[128, 128, 16, 16]} />
        <auroraMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

// ----------------------------------------------------------------------
// 4.5 PREMIUM GOLDEN CAKE (SVG)
// ----------------------------------------------------------------------
const PremiumCake = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [transparentSrc, setTransparentSrc] = useState(null);

  // Background Removal Logic (The True Silhouette - High Precision V3)
  useEffect(() => {
    const img = new Image();
    img.src = "/images/princess_cake.png";
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Aggressive 100% Transparency Filter
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        // Custom High-Sensitivity Threshold for AI-generated Dark backgrounds
        const isBackground = (brightness < 75 && (r < 80 && g < 80 && b < 120));

        // COORDINATE-BASED FIX: Aggressively cut the bottom 12% to remove shadow artifacts
        const y = Math.floor((i / 4) / canvas.width);
        if (isBackground || (y > canvas.height * 0.88 && brightness < 120)) {
          data[i + 3] = 0;
        } else if (brightness > 90) {
          data[i + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setTransparentSrc(canvas.toDataURL());
    };
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      setMousePos({ x: (e.clientX / window.innerWidth) - 0.5, y: (e.clientY / window.innerHeight) - 0.5 });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  if (!transparentSrc) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 2.2, duration: 2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        margin: '0.6rem 0 2rem 0', position: 'relative', width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', perspective: '1000px'
      }}
    >
      {/* Cinematic Glow Behind Cake Shape */}
      <div style={{ position: 'absolute', width: '280px', height: '280px', background: 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)', top: '60%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(55px)' }} />

      {/* 🎆 PREMIUM PERSONAL CELEBRATION (Now positioned relatively above cake) 🎆 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.5, duration: 1.5 }}
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          padding: '15px 25px',
          borderRadius: '24px',
          border: '1.5px solid rgba(255,215,0,0.3)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 20px rgba(255,215,0,0.15)',
          textAlign: 'center',
          marginBottom: '1rem',
          width: '90%',
          maxWidth: '320px',
          zIndex: 100
        }}
      >
        {/* Main Date & Message */}
        <h2 style={{
          fontFamily: '"Sacramento", cursive', fontSize: '28px', color: '#ffd700', margin: '0 0 8px 0',
          textShadow: '0 0 10px rgba(255,215,0,0.5)'
        }}>
          01 June
        </h2>

        <p style={{
          fontFamily: '"Cormorant Garamond", serif', fontSize: '15px', fontStyle: 'italic', color: '#ffffff',
          lineHeight: 1.4, margin: 0, opacity: 0.9
        }}>
          "The most favorite day of my life,<br />
          as it's your Birthday, meri jaan ❤️"
        </p>
      </motion.div>

      {/* The Masterpiece Asset with 3D Parallax */}
      <motion.div
        animate={{
          rotateX: mousePos.y * -12,
          rotateY: mousePos.x * 15,
          y: [0, -8, 0]
        }}
        transition={{
          rotateX: { type: 'spring', damping: 25 }, rotateY: { type: 'spring', damping: 25 },
          y: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
        }}
        style={{
          width: '90%', maxWidth: '280px', height: '35vh', minHeight: '220px', maxHeight: '350px', position: 'relative',
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}
      >
        <img
          src={transparentSrc}
          alt="Princess Cake"
          style={{
            width: '120%', height: '120%', objectFit: 'contain',
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.9)) saturate(1.1)'
          }}
        />
      </motion.div>

      {/* Atmospheric Particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [-10, -120], x: (Math.random() - 0.5) * 180 }}
            transition={{ repeat: Infinity, duration: 4 + Math.random() * 2, delay: Math.random() * 4 }}
            style={{ position: 'absolute', top: '80%', left: '50%', width: '2px', height: '2px', borderRadius: '50%', background: i % 2 === 0 ? '#ffd700' : '#f472b6' }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// ----------------------------------------------------------------------
// 5. INK ON WATER REVEAL (Typography Component)
// ----------------------------------------------------------------------
const InkTextReveal = ({ text, delayOffset = 0 }) => {
  const words = text.split(' ');
  let charIdx = 0;

  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      {words.map((word, wIdx) => (
        <span key={wIdx} style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}>
          {word.split('').map((char, cIdx) => {
            const delay = delayOffset + (charIdx++) * 0.08;
            return (
              <motion.span
                key={cIdx}
                initial={{ opacity: 0, filter: 'blur(10px)', y: 15 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{ duration: 1.5, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 'clamp(1rem, 4vw, 1.4rem)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  textShadow: '0 2px 15px rgba(255,255,255,0.6)'
                }}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

// ----------------------------------------------------------------------
// MAIN ACT 1 COMPONENT
// ----------------------------------------------------------------------
const Act1Invitation = ({ onComplete }) => {
  const [isClicked, setClicked] = useState(false);
  const [showSub, setShowSub] = useState(false);

  useEffect(() => {
    // Reveal the subtitle string after 3 seconds
    const t = setTimeout(() => setShowSub(true), 3000);

    // PRELOAD GARDEN TEXTURES for seamless transition
    CONFIG.MEMORIES.forEach(m => {
      const img = new Image();
      img.src = m.image;
    });

    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', backgroundColor: '#020308' }}>

      {/* ── BACKGROUND 3D SCENE ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Canvas gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}>
          <color attach="background" args={['#020308']} />
          <CinematicCameraRig />
          <LivingAurora fadeOutTarget={1} />
          <CinematicStars />
          <StardustPath />

          <EffectComposer disableNormalPass multisampling={0}>
            <Bloom luminanceThreshold={0.1} mipmapBlur intensity={2.5} />
            <Vignette eskil={false} offset={0.3} darkness={0.9} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Deep Space Vignette Layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(circle at center, transparent 0%, rgba(2,3,8,0.85) 100%)', pointerEvents: 'none' }} />

      {/* ── TYPOGRAPHY & CHOREOGRAPHY (Foreground) ── */}
      <motion.div
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >

        {/* Name Reveal (Golden Cursive) with Flowers */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(15px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
          style={{ marginBottom: '0', marginTop: '3rem', textAlign: 'center', position: 'relative' }}
        >
          {/* Flower Burst Particles */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: -1 }}>
            {[...Array(12)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0, y: 0, x: 0 }}
                animate={{
                  opacity: [0, 0.7, 0],
                  scale: [0, 1.2, 0.8],
                  y: [-20, -80 - Math.random() * 50],
                  x: [(Math.random() - 0.5) * 150, (Math.random() - 0.5) * 300],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "easeOut"
                }}
                style={{ position: 'absolute', left: '50%', top: '50%', fontSize: '14px' }}
              >
                {['🌸', '🌺', '✨', '🌸'][i % 4]}
              </motion.span>
            ))}
          </div>

          <h1 style={{
            fontFamily: '"Sacramento", cursive',
            fontSize: 'clamp(2.5rem, 12vw, 5.5rem)',
            margin: 0,
            lineHeight: 1,
            background: `linear-gradient(135deg, #ffd700 0%, #f7e7ce 35%, #ffd700 65%, #f7e7ce 100%)`,
            backgroundSize: '200% 200%',
            animation: 'goldShimmer 4s ease-in-out infinite',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 30px rgba(255, 215, 0, 0.4))`
          }}>
            {CONFIG.NAME}
          </h1>
        </motion.div>

        {/* Premium Re-added Cake */}
        <PremiumCake />

        {/* Happy Birthday Subtitle (Ink on Water) */}
        <AnimatePresence>
          {showSub && (
            <div style={{ marginTop: '2rem', marginBottom: '4rem', padding: '0 20px', maxWidth: '100%', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                {/* Single Line Text */}
                <div style={{ width: '100%' }}>
                  <InkTextReveal text="HAPPY BIRTHDAY SWEETHEART" delayOffset={0} />
                </div>

                {/* Booming Heart Below */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [1, 1.6, 1],
                    opacity: [0.8, 1, 0.8],
                    filter: ['drop-shadow(0 0 5px #ff0000)', 'drop-shadow(0 0 20px #ff0000)', 'drop-shadow(0 0 5px #ff0000)']
                  }}
                  transition={{
                    scale: { repeat: Infinity, duration: 0.8, ease: "easeInOut" },
                    opacity: { repeat: Infinity, duration: 0.8 },
                    delay: 2.5 // Appear after text starts
                  }}
                  style={{ fontSize: '32px', cursor: 'default' }}
                >
                  ❤️
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>

        <motion.div
          onClick={() => onComplete()}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5, delay: 6 }}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            zIndex: 150,
            padding: '8px 14px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            borderRadius: '20px',
            border: '1px solid rgba(255,215,0,0.3)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
          }}
          whileHover={{ scale: 1.05, borderColor: 'rgba(255,215,0,0.8)' }}
          whileTap={{ scale: 0.95 }}
        >
          <span style={{
            fontFamily: 'system-ui, sans-serif', letterSpacing: '0.15em', fontSize: '10px', color: '#FFD700',
            textTransform: 'uppercase', fontWeight: 700,
            whiteSpace: 'nowrap'
          }}>
            Next
          </span>
          <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes goldShimmer { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
    </div>
  );
};

export default Act1Invitation;
