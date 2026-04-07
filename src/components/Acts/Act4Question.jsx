import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, MeshDistortMaterial, PresentationControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

const GoldenRing = ({ tilt }) => {
  const ringRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.y = time * 0.5 + tilt.y * 0.5;
      ringRef.current.rotation.x = Math.sin(time * 0.3) * 0.2 + tilt.x * 0.3;
    }
  });

  return (
    <group ref={ringRef}>
      {/* The Band */}
      <mesh>
        <torusGeometry args={[1, 0.05, 16, 100]} />
        <meshStandardMaterial 
          color={CONFIG.COLOR.ACCENT} 
          metalness={1} 
          roughness={0.1} 
          emissive={CONFIG.COLOR.ACCENT}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* The "Stone" (Glowy light) */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.08, 32, 32]} />
        <MeshDistortMaterial 
          color="white" 
          speed={2} 
          distort={0.4} 
          emissive="white" 
          emissiveIntensity={2} 
        />
      </mesh>
    </group>
  );
};

const Act4Question = ({ onComplete, tilt }) => {
  const [showButton, setShowButton] = useState(false);
  const [words, setWords] = useState([]);
  const fullSentence = CONFIG.PROPOSAL_SENTENCE.split(' ');

  useEffect(() => {
    let currentWordIndex = 0;
    const interval = setInterval(() => {
      if (currentWordIndex < fullSentence.length) {
        setWords((prev) => [...prev, fullSentence[currentWordIndex]]);
        currentWordIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowButton(true), 1500);
      }
    }, 800); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      position: 'absolute', 
      inset: 0, 
      backgroundColor: 'var(--royal-peach)', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      {/* PRINCESS THEME: SOLID PEACH LAYER + WATERMARK (RE-USED PALACE) */}
      <div className="bg-palace" style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.1, pointerEvents: 'none' }} />

      <Canvas camera={{ position: [0, 0, 5] }} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color={CONFIG.COLOR.SECONDARY} />
        
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0.5} fade speed={1} color={CONFIG.COLOR.PRIMARY} />

        <PresentationControls global rotation={[0, 0, 0]} polar={[-0.4, 0.4]} azimuth={[-0.4, 0.4]}>
           <GoldenRing tilt={tilt} />
        </PresentationControls>
      </Canvas>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', paddingBottom: '2rem', zIndex: 2 }}>
        <div style={{ maxWidth: '42rem', textAlign: 'center', padding: '0 2rem' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ 
               fontSize: '1rem', 
               textTransform: 'uppercase', 
               letterSpacing: '0.6em', 
               color: 'var(--liquid-gold-start)',
               opacity: 0.7
            }}>
               To my Forever,
            </span>
            <h1 className="title-glow" style={{ 
               fontSize: '3.5rem', 
               color: 'var(--liquid-gold-start)',
               fontFamily: 'serif',
               fontStyle: 'italic',
               marginTop: '0.5rem',
               textShadow: '0 0 20px rgba(212, 175, 55, 0.2)'
            }}>
               {CONFIG.NAME}
            </h1>
          </div>
          <p className="font-proposal italic" style={{ fontSize: '2rem', lineHeight: 1.3, color: 'var(--liquid-gold-start)' }}>
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: i * 0.1 }}
                style={{ 
                  display: 'inline-block', 
                  marginRight: '0.8rem',
                  textShadow: '0 0 15px rgba(212, 175, 55, 0.3)'
                }}
              >
                {word}
              </motion.span>
            ))}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ position: 'absolute', bottom: '5rem', zIndex: 20 }}
          >
            <button
              onClick={onComplete}
              className="font-heading title-glow"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                color: 'var(--liquid-gold-start)', 
                padding: '16px 56px', 
                borderRadius: '9999px', 
                fontSize: '1.25rem', 
                letterSpacing: '0.2em', 
                textTransform: 'uppercase',
                border: '1px solid var(--liquid-gold-start)',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)'
              }}
            >
              Always.
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Act4Question;
