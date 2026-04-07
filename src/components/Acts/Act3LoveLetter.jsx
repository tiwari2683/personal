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
// 🎭 MAIN ACT 3 COMPONENT: THE NEBULA OF DREAMS (Refined Cinematic Version)
// ============================================================================
const Act3LoveLetter = ({ onComplete }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isReadingFinished, setIsReadingFinished] = useState(false);

  // Break the letter into emotional phrases
  const phrases = useMemo(() => {
    return CONFIG.LOVE_LETTER.match(/[^.!?]+[.!?]*/g) || [CONFIG.LOVE_LETTER];
  }, []);

  const currentPhrase = phrases[phraseIndex];
  const words = useMemo(() => currentPhrase.trim().split(' '), [currentPhrase]);

  useEffect(() => {
    setIsReadingFinished(false);
    
    // Calculate display duration: 300ms per word + 4 seconds padding
    const duration = Math.max(5000, words.length * 350 + 4000);
    
    // Mark as finished after the stagger animation would realistically end
    const finishTimer = setTimeout(() => setIsReadingFinished(true), words.length * 200 + 2000);
    
    const nextTimer = setTimeout(() => {
      setPhraseIndex((prev) => {
        if (prev < phrases.length - 1) return prev + 1;
        return prev;
      });
    }, duration);

    return () => {
      clearTimeout(finishTimer);
      clearTimeout(nextTimer);
    };
  }, [phraseIndex, phrases.length, words.length]);

  const goToNext = () => {
    if (phraseIndex < phrases.length - 1) setPhraseIndex(phraseIndex + 1);
    else onComplete();
  };

  const isLastPhrase = phraseIndex === phrases.length - 1;

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.abyss, overflow: 'hidden' }}>
      
      {/* 3D CELESTIAL STAGE */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: false, stencil: false }}>
          <fog attach="fog" args={[PALETTE.abyss, 5, 30]} />
          <ambientLight intensity={0.4} />
          <BreathingNebula />
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
             <pointLight position={[0, 0, 0]} color={PALETTE.peach} intensity={1} distance={15} />
          </Float>
          <EffectComposer multisampling={0}>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1} />
            <Vignette offset={0.5} darkness={0.7} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* 2D TYPOGRAPHY LAYER */}
      <div 
        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'pointer' }}
        onClick={isReadingFinished ? goToNext : null}
      >
        <div style={{ maxWidth: '85%', textAlign: 'center', padding: '2rem' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={phraseIndex}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { staggerChildren: 0.15, delayChildren: 0.5 } 
                },
                exit: { 
                  opacity: 0, 
                  y: -20, 
                  filter: 'blur(10px)',
                  transition: { duration: 1.5 } 
                }
              }}
            >
              <div style={{ 
                color: '#ffffff', 
                fontFamily: 'serif', 
                fontSize: '1.8rem', 
                fontStyle: 'italic',
                lineHeight: '1.8', 
                fontWeight: '300',
                textShadow: '0 0 20px rgba(255, 218, 185, 0.2)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {words.map((word, i) => (
                  <motion.span
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 10, filter: 'blur(5px)' },
                      visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
                    }}
                    transition={{ duration: 1 }}
                    style={{ marginRight: '0.6rem' }}
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MANUAL NAVIGATION NUDGE (Only appears after reading) */}
      <AnimatePresence>
        {isReadingFinished && !isLastPhrase && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: '15%', width: '100%', textAlign: 'center', pointerEvents: 'none' }}
          >
            <p style={{ color: PALETTE.peach, fontSize: '9px', letterSpacing: '0.4em', textTransform: 'uppercase' }}>
              Tap to continue
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FINAL CONTINUATION BUTTON */}
      <AnimatePresence>
        {isLastPhrase && isReadingFinished && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 2 }}
            style={{ position: 'absolute', bottom: '10%', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 20 }}
          >
            <motion.button 
              onClick={onComplete}
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
                padding: '16px 32px', 
                textTransform: 'uppercase'
              }}
            >
              Step into the light ➔
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROGRESS TRACKER */}
      <div style={{ position: 'absolute', top: '2rem', left: '10%', right: '10%', height: '1px', background: 'rgba(255,255,255,0.03)' }}>
        <motion.div 
           animate={{ width: `${((phraseIndex + 1) / phrases.length) * 100}%` }}
           style={{ height: '100%', background: PALETTE.peach, opacity: 0.2 }}
        />
      </div>

    </div>
  );
};


export default Act3LoveLetter;
