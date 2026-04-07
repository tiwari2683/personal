import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Stars, Sparkles, Center } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG } from '../../config';

const Particles = ({ tilt }) => {
  const points = useRef();
  const [count] = useState(100);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 10;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const time = state.clock.getElapsedTime();
    points.current.rotation.y = time * 0.1 + tilt.y * 0.2;
    points.current.rotation.x = tilt.x * 0.1;
    
    const attr = points.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
        const y = attr.getY(i);
        attr.setY(i, y + Math.sin(time + i) * 0.001);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={CONFIG.COLOR.ACCENT}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const Act1Invitation = ({ onComplete, tilt }) => {
  const [isHovered, setHovered] = useState(false);
  const [isClicked, setClicked] = useState(false);

  useEffect(() => {
    if (isClicked) {
      const timer = setTimeout(() => onComplete(), 500);
      return () => clearTimeout(timer);
    }
  }, [isClicked, onComplete]);

  return (
    <div 
      onClick={() => setClicked(true)}
      className="bg-aurora"
      style={{ 
        position: 'absolute', 
        inset: 0, 
        overflow: 'hidden', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        cursor: 'pointer'
      }}
    >
      {/* 3D LAYER */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Canvas 
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          style={{ height: '100%', width: '100%' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color={CONFIG.COLOR.SECONDARY} />
          
          {/* THEME MAPPING: CHERRY-BLOSSOM / PEACH STARS */}
          <Stars 
            radius={100} 
            depth={50} 
            count={5000} 
            factor={4} 
            saturation={0.5} 
            fade 
            speed={2} 
            color={CONFIG.COLOR.PRIMARY} 
          />
          
          {/* THEME MAPPING: CHAMPAGNE SPARKLES */}
          <Sparkles 
            count={60} 
            scale={10} 
            size={4} 
            speed={0.5} 
            color={CONFIG.COLOR.ACCENT} 
          />

          <Center top>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              <Text
                fontSize={0.9}
                color={CONFIG.COLOR.ACCENT}
                maxWidth={200}
                lineHeight={1}
                letterSpacing={0.05}
                textAlign="center"
                anchorX="center"
                anchorY="middle"
                font="https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/cormorantgaramond/CormorantGaramond-Italic.ttf"
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
              >
                {CONFIG.NAME}
              </Text>
            </Float>
          </Center>

          {/* SECONDARY TEXT: ROYAL COMBINATION */}
          <Center bottom position={[0,-0.6,0]}>
                <Text 
                  fontSize={0.2} 
                  color={CONFIG.COLOR.SECONDARY} 
                  opacity={0.8}
                  font="https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/cormorantgaramond/CormorantGaramond-Italic.ttf"
                >
                    MY PRINCESS
                </Text>
          </Center>

          <Particles tilt={tilt} />
        </Canvas>
      </div>

      {/* UI OVERLAY LAYER */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        
        {/* CROWN SVG */}
        <div style={{ position: 'absolute', top: '32%', opacity: 0.6 }}>
           <svg width="60" height="36" viewBox="0 0 100 60" fill={CONFIG.COLOR.ACCENT}>
               <path d="M10 50 L20 10 L40 40 L50 10 L60 40 L80 10 L90 50 Z" />
           </svg>
        </div>

        {/* INTERACTION PROMPT */}
        <div 
          className="animate-pulse"
          style={{ 
            position: 'absolute', 
            bottom: '4rem', 
            opacity: isClicked ? 0 : 1, 
            transition: 'opacity 1s ease' 
          }}
        >
          <p className="font-light title-glow" style={{ 
            color: 'var(--liquid-gold-start)', 
            letterSpacing: '0.4em', 
            textTransform: 'uppercase', 
            fontSize: '0.8rem', 
            textAlign: 'center' 
          }}>
            TOUCH ME
          </p>
        </div>
      </div>

      {/* TRANSITION OVERLAY */}
      {isClicked && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          backgroundColor: CONFIG.COLOR.PRIMARY, 
          zIndex: 50, 
          transition: 'opacity 0.5s ease', 
          opacity: 1 
        }} />
      )}
    </div>
  );
};

export default Act1Invitation;
