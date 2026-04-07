import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';

import AuroraMaterial from '../../shaders/AuroraMaterial';
extend({ AuroraMaterial });

// ----------------------------------------------------------------------
// THE LIVING SKY & SNOWY TERRAIN
// ----------------------------------------------------------------------
const LivingAurora = () => {
  const materialRef = useRef();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      {/* The Sky */}
      <mesh position={[0, 2, -10]} scale={[35, 20, 1]}>
        <planeGeometry args={[1, 1, 128, 128]} />
        <auroraMaterial 
          ref={materialRef} 
          transparent 
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>

      {/* The Snowy Terrain */}
      {/* We rotate a plane to lay flat, and give it a slight icy reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, -5]}>
        <planeGeometry args={[50, 20, 32, 32]} />
        <meshStandardMaterial 
          color="#0a192f" // Deep midnight blue snow
          emissive="#020a14"
          roughness={0.7} 
          metalness={0.4} // Picks up the glow of the Aurora
        />
      </mesh>
    </group>
  );
};

// ----------------------------------------------------------------------
// MAGICAL RUBY HEARTS (GPGPU Particles)
// ----------------------------------------------------------------------
const RubyHearts = () => {
  const pointsRef = useRef();
  
  // Mathematically draw a heart texture so we don't rely on external images
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

  // Generate random starting positions at the bottom of the screen
  const [positions, speeds] = useMemo(() => {
    const count = 40; // 40 beautiful hearts
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15; // Spread wide X
      pos[i * 3 + 1] = -5 - Math.random() * 5; // Start below the snow Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5; // Depth Z
      spd[i] = 0.5 + Math.random() * 1.5; // Random floating speeds
    }
    return [pos, spd];
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array;
    
    // The "Swirl Power" peaks during the name reveal (seconds 3 to 10)
    const swirlPower = Math.max(0, Math.min(1, (time - 3) / 2)); 

    for (let i = 0; i < 40; i++) {
      // 1. Vertical Rise
      positions[i * 3 + 1] += speeds[i] * delta;
      
      // 2. Swirl Calculation (Attraction to Center + Spiral)
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      
      // Pull toward center X
      positions[i * 3] -= x * 0.01 * swirlPower;
      // Spiral around center (gentle Z-axis shift)
      positions[i * 3 + 2] += Math.sin(time + i) * 0.02 * swirlPower;
      
      // 3. Gentle Wind Sway (independent of swirl)
      positions[i * 3] += Math.sin(time * speeds[i] + i) * 0.005;
      
      // 4. Reset Logic
      if (positions[i * 3 + 1] > 6) {
        positions[i * 3 + 1] = -5;
        // Randomize X again on reset to keep the loop organic
        positions[i * 3] = (Math.random() - 0.5) * 15;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={40} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        map={heartTexture}
        size={0.6} 
        color="#ff0055" // Deep cinematic glowing ruby
        transparent 
        opacity={0.8}
        blending={THREE.AdditiveBlending} // Makes them glow like light
        depthWrite={false}
      />
    </points>
  );
};

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

  const drawLine = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { pathLength: { duration: 4, ease: "easeInOut" }, opacity: { duration: 1 } } }
  };

  const drawFast = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { pathLength: { duration: 2.5, ease: "easeInOut" }, opacity: { duration: 0.5 } } }
  };

  return (
    <div 
      onClick={() => setClicked(true)}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#010409' }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ alpha: true, antialias: true }}>
          {/* We need some light so the snow is visible */}
          <ambientLight intensity={0.2} color="#88aaff" />
          <pointLight position={[0, 5, -5]} intensity={2} color="#00ffcc" />

          <LivingAurora />
          <RubyHearts />
          
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={1} fade speed={0.5} />
          <Sparkles count={50} scale={12} size={4} speed={0.2} opacity={0.4} color="#FFD700" />
          
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.15} mipmapBlur intensity={2.0} />
          </EffectComposer>
        </Canvas>
      </div>

      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(1,4,9,0.9) 100%)', pointerEvents: 'none' }} />

      {/* SVG Text Layer (Unchanged from previous step) */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <motion.div initial="hidden" animate="visible" style={{ marginBottom: '1rem' }}>
          <svg width="60" height="36" viewBox="0 0 100 60" fill="transparent">
            <motion.path d="M10 50 L20 10 L40 40 L50 10 L60 40 L80 10 L90 50 Z" stroke="#FFD700" strokeWidth="2.5" strokeLinejoin="round" variants={drawLine} style={{ filter: 'drop-shadow(0px 0px 12px rgba(212, 175, 55, 1))' }} />
          </svg>
        </motion.div>

        <motion.div initial="hidden" animate="visible" transition={{ delay: 2 }} style={{ width: '280px', height: '80px', display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 300 100" fill="transparent">
            <motion.path d="M30 90 C 30 50, 40 20, 70 20 C 100 20, 100 50, 70 60 C 50 65, 30 65, 30 65 L 80 100 M 110 90 L 110 30 M 140 30 L 140 90 C 140 100, 150 100, 160 90 M 130 50 L 160 50 M 190 90 C 170 90, 170 50, 190 50 C 210 50, 210 90, 210 90 M 200 70 L 180 70 M 230 90 L 230 50 C 230 30, 250 30, 250 50 L 250 90 M 250 65 C 250 30, 280 30, 280 50 L 280 90" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" variants={drawLine} style={{ filter: 'drop-shadow(0px 0px 15px rgba(255, 215, 0, 0.8))' }} />
          </svg>
        </motion.div>

        <motion.div initial="hidden" animate="visible" transition={{ delay: 5 }} style={{ width: '240px', height: '40px', marginTop: '1rem' }}>
          <svg viewBox="0 0 300 50" fill="transparent">
            <motion.path d="M10 40 L10 10 M10 25 L30 25 M30 40 L30 10 M50 40 L40 10 L60 10 L50 40 M70 40 L70 10 C90 10, 90 25, 70 25 M100 40 L100 10 C120 10, 120 25, 100 25 M130 10 L140 25 L150 10 M140 25 L140 40 M180 40 L180 10 C200 10, 200 25, 180 25 C200 25, 200 40, 180 40 M210 40 L210 10 M230 10 L220 40 L240 40 M260 40 L260 10 M250 10 L270 10 M290 10 L290 40 M280 25 L300 25" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" variants={drawFast} style={{ filter: 'drop-shadow(0px 0px 8px rgba(255, 215, 0, 0.6))' }} />
          </svg>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: isClicked ? 0 : [0.3, 1, 0.3] }} transition={{ duration: 3, delay: 8, repeat: Infinity, ease: "easeInOut" }} style={{ position: 'absolute', bottom: '4rem' }}>
          <svg width="200" height="20" viewBox="0 0 200 20" fill="transparent">
             <text x="50%" y="15" textAnchor="middle" fill="#FFD700" style={{ letterSpacing: '0.3em', fontSize: '10px', textTransform: 'uppercase', filter: 'drop-shadow(0px 0px 5px rgba(255,215,0,0.8))' }}>
               Touch to enter her world
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
