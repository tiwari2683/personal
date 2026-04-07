import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Stars, Sparkles, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';

import AuroraMaterial from '../../shaders/AuroraMaterial';
extend({ AuroraMaterial });

// ----------------------------------------------------------------------
// 1. FALLING SNOW PARTICLES
// ----------------------------------------------------------------------
const FallingSnow = () => {
  const pointsRef = useRef();
  const count = 600;

  const [positions, speeds, swayOffsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const sway = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30; 
      pos[i * 3 + 1] = Math.random() * 20 - 4; 
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 2; 
      spd[i] = 0.5 + Math.random() * 1.5; 
      sway[i] = Math.random() * Math.PI * 2; 
    }
    return [pos, spd, sway];
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= speeds[i] * delta * 0.8;
      pos[i * 3] += Math.sin(time + swayOffsets[i]) * 0.01;
      if (pos[i * 3 + 1] < -3) {
        pos[i * 3 + 1] = 15;
        pos[i * 3] = (Math.random() - 0.5) * 30;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#e0f2fe" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// ----------------------------------------------------------------------
// 2. THE LIVING SKY & FROZEN LAKE
// ----------------------------------------------------------------------
const LivingAurora = () => {
  const materialRef = useRef();
  useFrame((state) => {
    if (materialRef.current) materialRef.current.uTime = state.clock.elapsedTime;
  });

  return (
    <group>
      {/* The Sky - Moved back for star field depth */}
      <mesh position={[0, 2, -15]} scale={[45, 30, 1]}>
        <planeGeometry args={[1, 1, 128, 128]} />
        <auroraMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, -5]}>
        <planeGeometry args={[50, 20]} />
        <MeshReflectorMaterial 
          blur={[300, 100]} 
          resolution={1024}
          mixBlur={1}
          mixStrength={50} 
          roughness={0.2}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#051020" 
          metalness={0.8}
        />
      </mesh>
    </group>
  );
};

// ----------------------------------------------------------------------
// 3. MAGICAL RUBY HEARTS
// ----------------------------------------------------------------------
const RubyHearts = () => {
  const pointsRef = useRef();
  
  const heartTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(32, 15);
    ctx.bezierCurveTo(32, 12, 25, 0, 15, 0);
    ctx.bezierCurveTo(0, 0, 0, 15, 0, 15);
    ctx.bezierCurveTo(0, 25, 15, 35, 32, 50);
    ctx.bezierCurveTo(50, 35, 64, 25, 64, 15);
    ctx.bezierCurveTo(64, 15, 64, 0, 49, 0);
    ctx.bezierCurveTo(39, 0, 32, 12, 32, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }, []);

  const [positions, speeds] = useMemo(() => {
    const count = 40;
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = -5 - Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
      spd[i] = 0.5 + Math.random() * 1.5;
    }
    return [pos, spd];
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array;
    const swirlPower = Math.max(0, Math.min(1, (time - 3) / 2)); 

    for (let i = 0; i < 40; i++) {
      positions[i * 3 + 1] += speeds[i] * delta;
      const x = positions[i * 3];
      positions[i * 3] -= x * 0.01 * swirlPower;
      positions[i * 3 + 2] += Math.sin(time + i) * 0.02 * swirlPower;
      positions[i * 3] += Math.sin(time * speeds[i] + i) * 0.005;
      
      if (positions[i * 3 + 1] > 6) {
        positions[i * 3 + 1] = -5;
        positions[i * 3] = (Math.random() - 0.5) * 15;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={40} array={positions} itemSize={3} /></bufferGeometry>
      <pointsMaterial map={heartTexture} size={0.6} color="#ff0055" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

// ----------------------------------------------------------------------
// 4. CRYSTAL ROSES (Glowing from the Ice)
// ----------------------------------------------------------------------
const CrystalRose = ({ position, scale }) => {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.05;
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ff0044" emissive="#550011" emissiveIntensity={2} metalness={1} roughness={0} />
      </mesh>
      <pointLight color="#ff0044" intensity={1} distance={3} />
    </group>
  );
};

const CrystalRoseField = ({ isVisible }) => {
  const roses = useMemo(() => [
    { position: [-4, -2.8, -2], scale: 0.15 },
    { position: [4, -2.8, -1], scale: 0.2 },
    { position: [-2, -2.9, 1], scale: 0.1 },
    { position: [2, -2.9, 2], scale: 0.12 },
    { position: [6, -2.8, -3], scale: 0.18 },
    { position: [-7, -2.8, -4], scale: 0.22 },
  ], []);

  return (
    <motion.group initial={{ scale: 0 }} animate={{ scale: isVisible ? 1 : 0 }} transition={{ duration: 2 }}>
      {roses.map((rose, i) => <CrystalRose key={i} {...rose} />)}
    </motion.group>
  );
};

// ----------------------------------------------------------------------
// 5. CINEMATIC METEOROIDS (Shooting Stars)
// ----------------------------------------------------------------------
const ShootingStar = () => {
  const meshRef = useRef();
  const [active, setActive] = useState(false);

  const reset = () => {
    if (!meshRef.current) return;
    meshRef.current.position.set((Math.random() - 0.5) * 30, 10 + Math.random() * 10, -12);
    meshRef.current.rotation.z = -Math.PI / 4;
    setActive(true);
  };

  useEffect(() => {
    const timer = setInterval(() => { if (!active) reset(); }, 4000 + Math.random() * 8000);
    return () => clearInterval(timer);
  }, [active]);

  useFrame((state, delta) => {
    if (!active || !meshRef.current) return;
    meshRef.current.position.x += 20 * delta;
    meshRef.current.position.y -= 20 * delta;
    meshRef.current.scale.x *= 0.96;
    if (meshRef.current.position.y < -10) {
      setActive(false);
      meshRef.current.scale.x = 1;
    }
  });

  return (
    <mesh ref={meshRef} scale={[1, 0.05, 0.05]}>
      <boxGeometry args={[2, 1, 1]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={active ? 0.9 : 0} />
    </mesh>
  );
};

const MeteoroidsField = () => (
  <group>
    <ShootingStar />
    <ShootingStar />
    <ShootingStar />
  </group>
);

// ----------------------------------------------------------------------
// 6. CELEBRATION FIREWORKS
// ----------------------------------------------------------------------
const Firework = ({ color }) => {
  const pointsRef = useRef();
  const [phase, setPhase] = useState('off'); // 'off', 'ascent', 'blast'
  const count = 120;
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 1 + Math.random() * 2; // Explosive power
        vel[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        vel[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        vel[i * 3 + 2] = r * Math.cos(phi);
    }
    return [pos, vel];
  }, []);

  const launch = () => {
    if (!pointsRef.current) return;
    const x = (Math.random() - 0.5) * 15;
    const z = -10 - Math.random() * 5;
    const pos = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
        pos[i * 3] = x; pos[i * 3 + 1] = -5; pos[i * 3 + 2] = z; // Start from bottom
    }
    setPhase('ascent');
    setTimeout(() => setPhase('blast'), 1000);
    setTimeout(() => setPhase('off'), 3500);
  };

  useEffect(() => {
    const timer = setInterval(() => { if (phase === 'off') launch(); }, 4000 + Math.random() * 4000);
    return () => clearInterval(timer);
  }, [phase]);

  useFrame((state, delta) => {
    if (phase === 'off' || !pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array;
    
    if (phase === 'ascent') {
        for (let i = 0; i < count; i++) {
            pos[i * 3 + 1] += 12 * delta; // Rise fast
            pos[i * 3] += Math.sin(state.clock.elapsedTime * 10) * 0.02; // Slight wiggle
        }
    } else {
        for (let i = 0; i < count; i++) {
            pos[i * 3] += velocities[i * 3] * delta * 4;
            pos[i * 3 + 1] += (velocities[i * 3 + 1] * delta * 4) - 0.8 * delta; // Gravity
            pos[i * 3 + 2] += velocities[i * 3 + 2] * delta * 4;
            // Friction (Slow down)
            velocities[i * 3] *= 0.98;
            velocities[i * 3 + 1] *= 0.98;
            velocities[i * 3 + 2] *= 0.98;
        }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
      <pointsMaterial 
        size={phase === 'ascent' ? 0.15 : 0.45} 
        color={color} 
        transparent 
        opacity={phase === 'off' ? 0 : 1} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </points>
  );
};

const FireworkField = () => (
  <group>
    <Firework color="#00ffff" />
    <Firework color="#ff00ff" />
    <Firework color="#ffd700" />
  </group>
);

// ----------------------------------------------------------------------
// MAIN ACT 1 COMPONENT
// ----------------------------------------------------------------------
const Act1Invitation = ({ onComplete }) => {
  const [isClicked, setClicked] = useState(false);

  useEffect(() => {
    if (isClicked) {
      const timer = setTimeout(() => onComplete(), 2500);
      return () => clearTimeout(timer);
    }
  }, [isClicked, onComplete]);

  // Framer Motion Variants
  const drawLine = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { pathLength: { duration: 3, ease: "easeInOut" }, opacity: { duration: 1 } } }
  };

  const letterAnimation = {
    hidden: { opacity: 0, y: 10, filter: 'blur(5px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.5, ease: "easeOut" } }
  };

  // Cinematic staggered text
  const fianceeText = "HAPPY BIRTHDAY FIANCÉE".split("");

  return (
    <div 
      onClick={() => setClicked(true)}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#010409' }}
    >
      {/* 3D SCENE */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.2} color="#88aaff" />
          <pointLight position={[0, 5, -5]} intensity={2} color="#00ffcc" />

          <LivingAurora />
          <RubyHearts />
          <FallingSnow />
          <CrystalRoseField isVisible={true} />
          
          <Stars radius={40} depth={20} count={2500} factor={5} saturation={1} fade speed={1} />
          <MeteoroidsField />
          <FireworkField />
          {/* Enhanced twinkling frost */}
          <Sparkles count={400} scale={[25, 20, 10]} position={[0, 5, -5]} speed={1.5} size={5} opacity={0.9} color="#ffffff" />
          <Sparkles count={60} scale={15} size={6} speed={0.4} opacity={0.5} color="#FFD700" />
          
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.15} mipmapBlur intensity={2.0} />
          </EffectComposer>
        </Canvas>
      </div>

      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(1,4,9,0.7) 100%)', pointerEvents: 'none' }} />

      {/* CHOREOGRAPHY LAYER */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Name: RITAM (SVG Draw) */}
        <motion.div initial="hidden" animate="visible" transition={{ delay: 1 }} style={{ width: '280px', height: '80px', display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 300 100" fill="transparent">
            <motion.path d="M30 90 C 30 50, 40 20, 70 20 C 100 20, 100 50, 70 60 C 50 65, 30 65, 30 65 L 80 100 M 110 90 L 110 30 M 140 30 L 140 90 C 140 100, 150 100, 160 90 M 130 50 L 160 50 M 190 90 C 170 90, 170 50, 190 50 C 210 50, 210 90, 210 90 M 200 70 L 180 70 M 230 90 L 230 50 C 230 30, 250 30, 250 50 L 250 90 M 250 65 C 250 30, 280 30, 280 50 L 280 90" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" variants={drawLine} style={{ filter: 'drop-shadow(0px 0px 15px rgba(255, 215, 0, 0.8))' }} />
          </svg>
        </motion.div>

        {/* MASTERPIECE CAKE 2.0 (Gradients & Frosting) */}
        <motion.div 
          initial="hidden" 
          animate="visible" 
          style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '110px' }}
        >
          <svg width="120" height="120" viewBox="0 0 100 100" fill="transparent">
            <defs>
              <linearGradient id="bottomTierGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ff4477' }} />
                <stop offset="100%" style={{ stopColor: '#882233' }} />
              </linearGradient>
              <linearGradient id="topTierGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FFD700' }} />
                <stop offset="100%" style={{ stopColor: '#b8860b' }} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Plate */}
            <motion.ellipse cx="50" cy="92" rx="38" ry="6" stroke="#FFD700" strokeWidth="1.5" 
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3, type: "spring" }} />
            
            {/* Bottom Tier (Ruby Velvet) */}
            <motion.path d="M 22 90 L 22 62 Q 50 68 78 62 L 78 90 Q 50 96 22 90" fill="url(#bottomTierGrad)" 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.3, type: "spring", stiffness: 100 }} />
            
            {/* Bottom Frosting */}
            <motion.path d="M 22 62 Q 28 58 34 62 Q 40 66 46 62 Q 52 58 58 62 Q 64 66 70 62 Q 76 58 78 62" stroke="white" strokeWidth="2.5" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 3.8, duration: 0.8 }} />

            {/* Bottom Sprinkles */}
            {[ {x:32,y:75,c:'#44ffff'}, {x:45,y:82,c:'#ffff44'}, {x:60,y:72,c:'#ff99ff'}, {x:70,y:80,c:'#55ff55'} ].map((s,i) => (
              <motion.circle key={i} cx={s.x} cy={s.y} r="2.5" fill={s.c} 
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 0.8, scale: 1 }} transition={{ delay: 4.5 + i*0.1 }} />
            ))}

            {/* Top Tier (Lunar Gold) */}
            <motion.path d="M 32 62 L 32 42 Q 50 48 68 42 L 68 62 Q 50 68 32 62" fill="url(#topTierGrad)" 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4.0, type: "spring", stiffness: 100 }} />
            
            {/* Top Frosting */}
            <motion.path d="M 32 42 Q 36 38 42 42 Q 48 46 54 42 Q 60 38 66 42 Q 68 42 68 42" stroke="white" strokeWidth="2.5" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 4.4, duration: 0.8 }} />
            
            {/* Top Sprinkles */}
            {[ {x:40,y:52,c:'#ff4444'}, {x:50,y:58,c:'#4488ff'}, {x:60,y:50,c:'#ffffff'} ].map((s,i) => (
              <motion.circle key={i} cx={s.x} cy={s.y} r="2" fill={s.c} 
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 0.8, scale: 1 }} transition={{ delay: 4.8 + i*0.1 }} />
            ))}

            {/* Pink Candle */}
            <motion.rect x="48" y="27" width="4" height="15" rx="1" fill="#ff66aa" 
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 5.2, type: "spring" }} />
            
            {/* The Flame */}
            <motion.path 
              d="M 50 24 C 47 18, 50 8, 50 8 C 50 8, 53 18, 50 24 Z" 
              fill="#ffffff" filter="url(#glow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.8, 1], scale: [0, 1.2, 0.9, 1.1] }}
              transition={{ delay: 5.6, duration: 1.2, repeat: Infinity, repeatType: "mirror" }}
            />
          </svg>
        </motion.div>

        {/* STAGGERED REVEAL: HAPPY BIRTHDAY FIANCÉE */}
        <motion.div 
          initial="hidden" 
          animate="visible" 
          transition={{ staggerChildren: 0.1, delayChildren: 6 }} 
          style={{ 
            marginTop: '1.5rem', 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '0.8rem', 
            flexWrap: 'wrap', 
            maxWidth: '360px' 
          }}
        >
          {["HAPPY", "BIRTHDAY", "FIANCÉE"].map((word, wordIndex) => (
            <div key={wordIndex} style={{ display: 'flex', gap: '2px' }}>
              {word.split("").map((char, charIndex) => (
                <motion.span 
                  key={charIndex} 
                  variants={letterAnimation}
                  style={{ 
                    color: '#FFD700', 
                    fontFamily: 'serif', 
                    fontSize: '1.1rem', 
                    letterSpacing: '0.1em', 
                    textShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          ))}
        </motion.div>

        {/* Navigational Affordance (Arrow + Meaningful Text) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: isClicked ? 0 : 1, y: 0 }} 
          transition={{ duration: 1.5, delay: 9 }} 
          style={{ position: 'absolute', bottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
        >
          {/* Pulsing Arrow */}
          <motion.div
            animate={{ y: [0, 5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 0px 8px rgba(255,215,0,0.8))' }}>
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </motion.div>

          <svg width="280" height="20" viewBox="0 0 280 20" fill="transparent">
             <text x="50%" y="15" textAnchor="middle" fill="#FFD700" style={{ letterSpacing: '0.25em', fontSize: '11px', fontWeight: 'lighter', textTransform: 'uppercase', filter: 'drop-shadow(0px 0px 5px rgba(255,215,0,0.8))' }}>
               Start our story together
             </text>
          </svg>
        </motion.div>
      </div>

      {isClicked && <div style={{ position: 'absolute', inset: 0, backgroundColor: '#fff', zIndex: 50, animation: 'fadeToWhite 2.5s forwards ease-in-out' }} />}
      <style>{`@keyframes fadeToWhite { 0% { opacity: 0; } 100% { opacity: 1; } }`}</style>
    </div>
  );
};

export default Act1Invitation;
