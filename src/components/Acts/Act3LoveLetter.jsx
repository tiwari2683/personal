import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Float, Stars, Center } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { CONFIG } from '../../config';

// ============================================================================
// 👑 THE NEBULA PALETTE (Celestial & Intimate)
// ============================================================================
const PALETTE = {
  abyss: '#020205',     // Deeper than midnight
  nebula: '#1a0c2e',    // Deep violet nebula haze
  gold: '#FFD700',      // Shimmering words
  peach: '#FFDAB9',     // Soft ambient glow
};

// ============================================================================
// ✨ CELESTIAL BACKGROUND: BREATHING NEBULA
// ============================================================================
const BreathingNebula = () => {
  const nebulaRef = useRef();

  useFrame((state) => {
    if (!nebulaRef.current) return;
    const t = state.clock.elapsedTime;
    // Slow, rhythmic rotation and scale
    nebulaRef.current.rotation.z = t * 0.05;
    nebulaRef.current.scale.setScalar(1 + Math.sin(t * 0.2) * 0.1);
  });

  return (
    <group ref={nebulaRef}>
      {/* Large soft core of the nebula */}
      <Sparkles count={40} scale={20} size={15} speed={0.2} opacity={0.2} color={PALETTE.nebula} />
      {/* Outer golden dust */}
      <Sparkles count={60} scale={25} size={4} speed={0.5} opacity={0.4} color={PALETTE.peach} />
      {/* Deep stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
};

// ============================================================================
// 🎭 MAIN ACT 3 COMPONENT: THE NEBULA OF DREAMS
// ============================================================================
const Act3LoveLetter = ({ onComplete }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Break the letter into emotional phrases for rhythmic reveal
  const phrases = useMemo(() => {
    // Split by common sentence endings and logical pauses
    return CONFIG.LOVE_LETTER.match(/[^.!?]+[.!?]*/g) || [CONFIG.LOVE_LETTER];
  }, []);

  useEffect(() => {
    // Each phrase stays for 5 seconds including transitions
    const timer = setInterval(() => {
      setPhraseIndex((prev) => {
        if (prev < phrases.length - 1) return prev + 1;
        return prev; // Stay on last phrase
      });
    }, 5500);

    return () => clearInterval(timer);
  }, [phrases.length]);

  const isLastPhrase = phraseIndex === phrases.length - 1;

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.abyss, overflow: 'hidden' }}>
      
      {/* 3D CELESTIAL STAGE */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: false, stencil: false }}>
          <fog attach="fog" args={[PALETTE.abyss, 5, 30]} />
          
          <ambientLight intensity={0.4} />
          
          <BreathingNebula />

          {/* Floating light source that moves randomly */}
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
             <pointLight position={[0, 0, 0]} color={PALETTE.peach} intensity={1} distance={15} />
          </Float>

          {/* NO DEPTH OF FIELD: Pure stability for Act 3 */}
          <EffectComposer multisampling={0}>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.2} />
            <Vignette offset={0.5} darkness={0.7} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* 2D TYPOGRAPHY LAYER */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ maxWidth: '80%', textAlign: 'center', padding: '2rem' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={phraseIndex}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1 style={{ 
                color: '#ffffff', 
                fontFamily: 'serif', 
                fontSize: '1.8rem', 
                fontStyle: 'italic',
                lineHeight: '1.6', 
                fontWeight: '300',
                textShadow: '0 0 20px rgba(255, 218, 185, 0.3)',
                letterSpacing: '0.02em'
              }}>
                {phrases[phraseIndex]}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* CONTINUATION BUTTON (Appears near the end or on last phrase) */}
      <AnimatePresence>
        {isLastPhrase && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 2, duration: 2 }}
            style={{ position: 'absolute', bottom: '10%', width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}
          >
            <motion.button 
              onClick={onComplete}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ 
                background: 'rgba(255,218,185,0.05)', 
                border: '1px solid rgba(255,218,185,0.2)', 
                borderRadius: '30px', 
                color: PALETTE.peach, 
                letterSpacing: '0.3em', 
                fontSize: '11px', 
                cursor: 'pointer', 
                backdropFilter: 'blur(10px)', 
                padding: '14px 28px', 
                textTransform: 'uppercase'
              }}
            >
              Step into the light ➔
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OPTIONAL: PROGRESS INDICATOR (Minimalist) */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '10%', right: '10%', height: '1px', background: 'rgba(255,255,255,0.05)' }}>
        <motion.div 
           animate={{ width: `${((phraseIndex + 1) / phrases.length) * 100}%` }}
           transition={{ duration: 1 }}
           style={{ height: '100%', background: PALETTE.peach, opacity: 0.3 }}
        />
      </div>

    </div>
  );
};

export default Act3LoveLetter;
