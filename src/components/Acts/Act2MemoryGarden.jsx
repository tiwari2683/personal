import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Float, Text, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG } from '../../config';

const Orb = ({ position, image, caption, delay }) => {
  const [clicked, setClicked] = useState(false);
  const mesh = useRef();
  
  // SENSORY: Load texture with standard Three.js loader for maximum stability
  const texture = useLoader(THREE.TextureLoader, image || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=300&h=400');

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.getElapsedTime();
    // Heartbeat scale animation
    const s = 1 + Math.sin(time * 2 + delay) * 0.02;
    mesh.current.scale.set(s, s, s);
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position} onClick={() => setClicked(!clicked)}>
        {/* Memory Photo Mesh */}
        <mesh ref={mesh}>
          <planeGeometry args={[1.5, 2]} />
          <meshBasicMaterial 
            map={texture} 
            transparent 
            opacity={clicked ? 1 : 0.8} 
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Caption Reveal */}
        {clicked && (
          <Text
            fontSize={0.15}
            position={[0, -1.3, 0]}
            color={CONFIG.COLOR.ACCENT}
            maxWidth={1.5}
            textAlign="center"
            font="https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/cormorantgaramond/CormorantGaramond-Italic.ttf"
          >
            {caption}
          </Text>
        )}

        {/* Decorative Backdrop Glow */}
        <mesh position={[0, 0, -0.05]}>
           <circleGeometry args={[1.2, 32]} />
           <meshBasicMaterial color={CONFIG.COLOR.PRIMARY} transparent opacity={0.3} />
        </mesh>
      </group>
    </Float>
  );
};

const Act2MemoryGarden = ({ onComplete, tilt }) => {
  return (
    <div style={{ 
      position: 'absolute', 
      inset: 0, 
      backgroundColor: '#fffbf2', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      {/* PRINCESS THEME: CREEPER VINES OVERLAY */}
      <div className="bg-creepers" style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />

      <Canvas 
        style={{ height: '100%', width: '100%', zIndex: 2 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} color={CONFIG.COLOR.SECONDARY} />

        <Suspense fallback={null}>
          <group rotation={[tilt.x * 0.1, tilt.y * 0.1, 0]}>
            {CONFIG.MEMORIES.map((m, i) => (
              <Orb 
                key={m.id} 
                position={[(i - 2) * 2.5, Math.sin(i) * 1.5, 0]} 
                image={m.image} 
                caption={m.caption}
                delay={i * 1000}
              />
            ))}
          </group>
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
      </Canvas>

      {/* NAVIGATION BUTTON */}
      <div style={{ position: 'absolute', bottom: '2.5rem', zIndex: 10 }}>
        <button 
          onClick={onComplete}
          style={{ 
            borderRadius: '9999px', 
            border: '1px solid var(--aurora-rose-gold)', 
            color: 'var(--liquid-gold-start)', 
            fontWeight: 300, 
            letterSpacing: '0.1em', 
            fontSize: '0.75rem', 
            textTransform: 'uppercase',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            padding: '12px 32px',
            cursor: 'pointer',
            backdropFilter: 'blur(5px)'
          }}
        >
          Our story continues
        </button>
      </div>

      <div style={{ position: 'absolute', top: '2.5rem', textAlign: 'center', pointerEvents: 'none', zIndex: 5 }}>
        <h2 className="font-heading italic title-glow" style={{ fontSize: '1.5rem', color: 'var(--liquid-gold-start)', opacity: 0.9 }}>The Memory Garden</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--liquid-gold-mid)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem' }}>Touch a memory to bloom</p>
      </div>
    </div>
  );
};

export default Act2MemoryGarden;
