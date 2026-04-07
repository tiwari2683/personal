import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Stars, Text, Center } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG } from '../../config';
import confetti from 'canvas-confetti';

const Petal = ({ position, rotation, speed, color }) => {
  const mesh = useRef();
  useFrame((state) => {
    if (mesh.current) {
        mesh.current.position.y -= speed;
        mesh.current.rotation.x += 0.01;
        mesh.current.rotation.z += 0.02;
        if (mesh.current.position.y < -5) mesh.current.position.y = 5;
    }
  });

  return (
    <mesh ref={mesh} position={position} rotation={rotation}>
      <planeGeometry args={[0.2, 0.2]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} />
    </mesh>
  );
};

const Act5Bloom = ({ name, lastName }) => {
  useEffect(() => {
    // Launch celebratory confetti when the Act starts
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Peach and Gold confetti
      const colors = ['#ffe5d9', '#d4af37', '#f9e29c'];
      confetti({ ...defaults, particleCount, colors, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, colors, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

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
      {/* PRINCESS THEME: ROYAL PALACE WATERMARK */}
      <div className="bg-palace" style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.1, pointerEvents: 'none' }} />

      <Canvas style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color={CONFIG.COLOR.SECONDARY} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0.5} fade speed={1} color={CONFIG.COLOR.PRIMARY} />
        <Sparkles count={50} scale={10} size={5} speed={0.4} color={CONFIG.COLOR.ACCENT} />

        <Center top>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Text
              fontSize={0.5}
              color={CONFIG.COLOR.ACCENT}
              maxWidth={200}
              lineHeight={1.5}
              textAlign="center"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.1}
              font="https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/cormorantgaramond/CormorantGaramond-Italic.ttf"
            >
              Happy Birthday, {name} {lastName}
            </Text>
          </Float>
        </Center>
        
        <Center bottom position={[0,-0.6,0]}>
            <Text 
                fontSize={0.2} 
                color={CONFIG.COLOR.SECONDARY} 
                opacity={0.8}
                font="https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/cormorantgaramond/CormorantGaramond-Italic.ttf"
            >
                MY FOREVER PRINCESS
            </Text>
        </Center>

        {/* Falling Petals */}
        {Array.from({ length: 40 }).map((_, i) => (
          <Petal 
            key={i} 
            position={[Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 5 - 2]} 
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
            speed={0.01 + Math.random() * 0.02}
            color={i % 2 === 0 ? CONFIG.COLOR.PRIMARY : CONFIG.COLOR.SECONDARY}
          />
        ))}
      </Canvas>

      {/* FINAL MESSAGE OVERLAY */}
      <div style={{ position: 'absolute', bottom: '5rem', textAlign: 'center', zIndex: 10 }}>
        <p className="font-heading italic title-glow" style={{ fontSize: '1.25rem', color: 'var(--liquid-gold-start)', opacity: 0.9, letterSpacing: '0.2rem' }}>
            Forever Yours.
        </p>
      </div>
    </div>
  );
};

export default Act5Bloom;
