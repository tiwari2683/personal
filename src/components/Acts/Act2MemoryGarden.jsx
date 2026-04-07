import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Image, MeshReflectorMaterial, Float, Instance, Instances, Text, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { CONFIG } from '../../config';

// ============================================================================
// 👑 DESIGN SYSTEM & PALETTE
// ============================================================================
const PALETTE = {
  sky: '#0a0816',         // Very deep midnight twilight
  water: '#140c22',       // Deep magical purple river
  peachGlow: '#FFDAB9',   // Princess Peach glow
  roseGold: '#B76E79',    // Expensive metallic rose gold
  sakura: '#FFB7C5',      // Japanese cherry blossom pink
  lavender: '#E6E6FA',    // Soft magical ambient light
  goldTrim: '#FFD700',    // Royal gold accents
};

// ============================================================================
// 📍 CHOREOGRAPHY & LAYOUT DATA
// ============================================================================
const MEMORY_LAYOUT = [
  { position: [-1.2, 0.5, -5], rotation: [0, 0.15, 0], swayOffset: 0 },
  { position: [1.2, 0.8, -9], rotation: [0, -0.12, 0], swayOffset: 1.5 },
  { position: [-1.0, 0.3, -13], rotation: [0, 0.08, 0], swayOffset: 3.14 },
  { position: [1.2, 1.0, -17], rotation: [0, -0.1, 0], swayOffset: 4.5 },
  { position: [0, 0.6, -21], rotation: [0, 0, 0], swayOffset: 6.0 },
];

const PROCESSED_MEMORIES = CONFIG.MEMORIES.map((m, i) => {
  const layout = MEMORY_LAYOUT[i] || { position: [0, 0, -10 - i * 4], rotation: [0, 0, 0], swayOffset: i };
  return { ...m, url: m.image, title: m.caption, position: layout.position, rotation: layout.rotation, swayOffset: layout.swayOffset, id: i };
});

// ============================================================================
// 🌸 ADVANCED PHYSICS: SAKURA WIND SWARM
// ============================================================================
const SakuraPetal = ({ id, xOffset, yOffset, zOffset, speed, turbulence }) => {
  const ref = useRef();
  
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + id;
    
    // Complex mathematical wind simulation (Curl noise approximation)
    const windX = Math.sin(t * 0.5) * turbulence + Math.cos(t * 0.2) * 2;
    const windZ = Math.cos(t * 0.6) * turbulence + Math.sin(t * 0.3) * 2;
    
    // Falling logic with reset
    let currentY = (yOffset - (state.clock.elapsedTime * speed * 4)) % 25;
    if (currentY < -5) currentY += 25; 

    ref.current.position.set(xOffset + windX, currentY + 5, zOffset + windZ);
    
    // Organic tumbling rotation
    ref.current.rotation.set(
      Math.sin(t) * 2,
      t * 1.5,
      Math.cos(t) * 2
    );
  });
  return <Instance ref={ref} />;
};

const SakuraSwarm = ({ count = 250 }) => {
  const petalGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.2, 0.5, 0.4, 1.5, 0, 2);
    shape.bezierCurveTo(-0.4, 1.5, -0.2, 0.5, 0, 0);
    const geo = new THREE.ShapeGeometry(shape);
    geo.scale(0.06, 0.06, 0.06); 
    // Add a slight bend to the 2D shape to make it 3D
    geo.translate(0, -1, 0);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const z = Math.sin(positions.getY(i) * Math.PI) * 0.2;
      positions.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i * 0.1,
    speed: 0.15 + Math.random() * 0.2,
    turbulence: 1 + Math.random() * 3,
    xOffset: (Math.random() - 0.5) * 25,
    yOffset: Math.random() * 25,
    zOffset: 5 - Math.random() * 35, // Spread far back into the fog
  })), [count]);

  return (
    <Instances geometry={petalGeo}>
      <meshPhysicalMaterial color={PALETTE.sakura} side={THREE.DoubleSide} transparent opacity={0.8} roughness={0.4} transmission={0.2} />
      {particles.map((data, i) => <SakuraPetal key={i} {...data} />)}
    </Instances>
  );
};

// ============================================================================
// ✨ ADVANCED AI: WANDERING FIREFLIES
// ============================================================================
const WanderingFirefly = ({ id, startPos }) => {
  const ref = useRef();
  const speed = useMemo(() => 0.2 + Math.random() * 0.4, []);
  const radius = useMemo(() => 1 + Math.random() * 2, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + id;
    
    // Smooth 3D figure-eight wandering pattern
    ref.current.position.set(
      startPos[0] + Math.sin(t) * radius,
      startPos[1] + Math.sin(t * 1.5) * (radius * 0.5),
      startPos[2] + Math.cos(t) * radius
    );
    
    // Pulsing light intensity
    ref.current.scale.setScalar(0.5 + Math.sin(t * 3) * 0.5);
  });

  return (
    <mesh ref={ref} position={startPos}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial color={PALETTE.peachGlow} />
    </mesh>
  );
};

const FireflyCluster = ({ count = 60 }) => {
  const fireflies = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i * 10,
    startPos: [
      (Math.random() - 0.5) * 20,
      -1 + Math.random() * 4,
      -2 - Math.random() * 25
    ]
  })), [count]);

  return <group>{fireflies.map((f, i) => <WanderingFirefly key={i} {...f} />)}</group>;
};

// ============================================================================
// 🪷 BOTANICAL ARCHITECTURE: GLOWING LOTUS
// ============================================================================
const CrystalLotus = ({ position, scale, rotationOffset }) => {
  const ref = useRef();
  
  // Mathematically generate layered petals
  const petalCount = 8;
  const petals = useMemo(() => {
    const arr = [];
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      arr.push({
        rotY: angle,
        rotX: Math.PI / 6, // Tilt outward
        pos: [Math.cos(angle) * 0.15, 0.1, Math.sin(angle) * 0.15]
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Gentle bobbing on the water surface
    ref.current.position.y = position[1] + Math.sin(t * 0.8 + rotationOffset) * 0.08;
    // Extremely slow spin
    ref.current.rotation.y = rotationOffset + t * 0.05;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Dark Base Pad */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.05, 16]} />
        <meshStandardMaterial color="#050a0f" roughness={1} />
      </mesh>
      
      {/* Array of Translucent Glass Petals */}
      <group position={[0, 0.1, 0]}>
        {petals.map((p, i) => (
          <mesh key={i} position={p.pos} rotation={[p.rotX, p.rotY, 0]}>
            <coneGeometry args={[0.25, 0.5, 4, 1, true]} />
            <meshPhysicalMaterial color={PALETTE.lavender} transmission={0.95} roughness={0.1} thickness={0.2} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* The Magical Light Core */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={PALETTE.peachGlow} />
      </mesh>
      <pointLight color={PALETTE.peachGlow} intensity={0.6} distance={5} />
    </group>
  );
};

const RiverBanks = () => {
  const lotuses = useMemo(() => Array.from({ length: 24 }).map((_, i) => ({
    position: [
      (Math.random() > 0.5 ? 1 : -1) * (2.0 + Math.random() * 3), // Hug the edges
      -2.0, 
      -1 - Math.random() * 26
    ],
    scale: 0.5 + Math.random() * 0.5,
    rotationOffset: Math.random() * Math.PI * 2
  })), []);
  return <group>{lotuses.map((l, i) => <CrystalLotus key={i} {...l} />)}</group>;
};

// ============================================================================
// 🖼️ THE MASTERPIECE: ORNATE ROYAL FRAME (Fixed Image Loading)
// ============================================================================
const RoyalFrame = ({ data, isActive, onClick }) => {
  const groupRef = useRef();
  const anchorRef = useRef();
  
  // This is the bulletproof way to load textures in React Three Fiber
  const texture = useTexture(data.url);
  // Ensure the image isn't flipped or stretched weirdly
  texture.colorSpace = THREE.SRGBColorSpace;
  
  useFrame((state, delta) => {
    if (!anchorRef.current || !groupRef.current) return;
    
    // 1. Organic Swinging Physics (Like a hanging lantern)
    if (!isActive) {
      const t = state.clock.elapsedTime;
      const swingX = Math.sin(t * 0.6 + data.swayOffset) * 0.05;
      const swingZ = Math.cos(t * 0.4 + data.swayOffset) * 0.03;
      anchorRef.current.rotation.set(swingX, data.rotation[1] + swingZ, swingZ * 0.5);
    } else {
      // Lock rotation to face camera perfectly when active
      anchorRef.current.rotation.set(
        MathUtils.lerp(anchorRef.current.rotation.x, 0, 3 * delta),
        MathUtils.lerp(anchorRef.current.rotation.y, data.rotation[1], 3 * delta),
        MathUtils.lerp(anchorRef.current.rotation.z, 0, 3 * delta)
      );
    }

    // 2. Scale Animation
    const targetScale = isActive ? 1.05 : 0.95;
    anchorRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 3 * delta);
  });

  return (
    <group position={data.position}>
      {/* This invisible string represents the pivot point for the swing */}
      <group position={[0, 2.5, 0]} ref={anchorRef}>
        
        {/* The Frame Body (Hanging down from the pivot) */}
        <group position={[0, -2.5, 0]} ref={groupRef}>
          
          <Float speed={isActive ? 0 : 1} floatIntensity={isActive ? 0 : 0.2} rotationIntensity={0}>
            
            {/* Massive Touch Target */}
            <mesh onClick={(e) => { e.stopPropagation(); onClick(isActive ? null : data.id); }} visible={false}>
              <boxGeometry args={[4, 5.5, 1]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* --- ARCHITECTURAL ORNAMENTS --- */}
            {/* Main Rose Gold Backplate */}
            <mesh position={[0, 0, -0.06]}>
              <boxGeometry args={[3.3, 4.3, 0.04]} />
              <meshStandardMaterial color={PALETTE.roseGold} metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Inner Pearl Bevel */}
            <mesh position={[0, 0, -0.03]}>
              <boxGeometry args={[3.1, 4.1, 0.04]} />
              <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.8} />
            </mesh>

            {/* Corner Golden Spheres (Luxury Detailing) */}
            {[[-1.65, 2.15], [1.65, 2.15], [-1.65, -2.15], [1.65, -2.15]].map((pos, i) => (
              <mesh key={i} position={[pos[0], pos[1], -0.04]}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshStandardMaterial color={PALETTE.goldTrim} metalness={1} roughness={0.2} />
              </mesh>
            ))}

            {/* Ethereal Hanging Wire */}
            <mesh position={[0, 2.4, -0.05]}>
              <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
              <meshBasicMaterial color={PALETTE.goldTrim} transparent opacity={0.4} />
            </mesh>

            {/* Top Hinge Ring */}
            <mesh position={[0, 2.15, -0.05]} rotation={[Math.PI/2, 0, 0]}>
              <torusGeometry args={[0.08, 0.02, 16, 32]} />
              <meshStandardMaterial color={PALETTE.goldTrim} metalness={1} roughness={0.2} />
            </mesh>

            {/* --- THE PHOTOGRAPH (Fixed Black Box Bug) --- */}
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[2.9, 3.9]} />
              <meshBasicMaterial 
                map={texture} 
                toneMapped={false} 
                transparent={false} 
              /> 
            </mesh>

            {/* Protective Glass Layer */}
            <mesh position={[0, 0, 0.03]}>
              <planeGeometry args={[2.9, 3.9]} />
              <meshPhysicalMaterial transparent opacity={0.2} transmission={1} clearcoat={1} clearcoatRoughness={0.1} roughness={0} />
            </mesh>

            {/* Ambient Wall-Glow behind the frame */}
            <pointLight color={PALETTE.peachGlow} intensity={isActive ? 0 : 0.6} distance={6} position={[0, 0, -1]} />

          </Float>
        </group>
      </group>
    </group>
  );
};

// ============================================================================
// 🎬 THE DIRECTOR: 15-SECOND INTRO & LENS PULLS
// ============================================================================
const CinematicCamera = ({ activeId, introPhase }) => {
  const { camera } = useThree();
  const vec = new THREE.Vector3();
  const targetLook = new THREE.Vector3();

  useEffect(() => {
    // Starting position: High in the clouds, looking up at the sky
    camera.position.set(0, 25, 10);
    camera.lookAt(0, 30, -20);
  }, [camera]);

  useFrame((state, delta) => {
    if (introPhase) {
      // 🎥 THE GREAT DESCENT (0 to 10 seconds)
      // The camera slowly drops from the sky down to the river surface
      vec.set(0, 1.5, 6); 
      targetLook.set(0, 0, -15);
      
      camera.position.lerp(vec, 0.4 * delta); // Extremely slow, majestic drop
      
      const currentLookAt = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).add(camera.position);
      currentLookAt.lerp(targetLook, 0.6 * delta);
      camera.lookAt(currentLookAt);
      return;
    }

    // 📸 ACTIVE PHOTOGRAPHY MODE
    if (activeId !== null) {
      const target = PROCESSED_MEMORIES.find(m => m.id === activeId);
      // Move perfectly in front of the selected frame
      vec.set(target.position[0], target.position[1], target.position[2] + 5.2);
      targetLook.set(target.position[0], target.position[1], target.position[2]);
      
      camera.position.lerp(vec, 2.5 * delta);
      const currentLookAt = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).add(camera.position);
      currentLookAt.lerp(targetLook, 3 * delta);
      camera.lookAt(currentLookAt);

    } else {
      // 🛶 IDLE RIVER DRIFTING
      const t = state.clock.elapsedTime;
      vec.set(Math.sin(t * 0.1) * 0.5, 1.5 + Math.sin(t * 0.2) * 0.2, 6 - t * 0.1); 
      targetLook.set(0, 0, -25);
      
      camera.position.lerp(vec, 1.5 * delta);
      const currentLookAt = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).add(camera.position);
      currentLookAt.lerp(targetLook, 2 * delta);
      camera.lookAt(currentLookAt);
    }
  });
  return null;
};

const CinematicOptics = ({ activeId, introPhase }) => {
  const dofRef = useRef();
  useFrame((state, delta) => {
    if (dofRef.current) {
      // If in intro, keep depth of field blurry to focus on the text overlay.
      // If roaming, focus deep. If active, focus right in front of the lens.
      let targetFocus = 0.08; 
      if (introPhase) targetFocus = 0.005;
      else if (activeId !== null) targetFocus = 0.015;
      
      dofRef.current.focusDistance = MathUtils.lerp(dofRef.current.focusDistance, targetFocus, 2 * delta);
    }
  });

  return (
    // CRITICAL: multisampling={0} ensures NO mobile crashes!
    <EffectComposer disableNormalPass multisampling={0}>
      <Bloom luminanceThreshold={0.9} mipmapBlur intensity={0.4} /> {/* Minimal bloom to protect eyes/photos */}
      <Vignette offset={0.5} darkness={0.6} /> 
      <DepthOfField ref={dofRef} focalLength={0.04} bokehScale={activeId !== null || introPhase ? 5 : 1} height={480} />
    </EffectComposer>
  );
};

// ============================================================================
// 🎭 MAIN ACT 2 COMPONENT (The Stage)
// ============================================================================
const Act2MemoryGarden = ({ onComplete }) => {
  const [activeId, setActiveId] = useState(null);
  const [introSequence, setIntroSequence] = useState(0); // 0: Text 1, 1: Text 2, 2: Reveal 3D

  // The 15-Second Choreography Timeline
  useEffect(() => {
    const t1 = setTimeout(() => setIntroSequence(1), 4000); // "Close your eyes..."
    const t2 = setTimeout(() => setIntroSequence(2), 8000); // "And step into..."
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const introPhase = introSequence < 2;

  const activeIndex = useMemo(() => PROCESSED_MEMORIES.findIndex(m => m.id === activeId), [activeId]);
  const activeMemory = PROCESSED_MEMORIES[activeIndex];

  const goToNext = (e) => { e.stopPropagation(); setActiveId(PROCESSED_MEMORIES[(activeIndex + 1) % PROCESSED_MEMORIES.length].id); };
  const goToPrev = (e) => { e.stopPropagation(); setActiveId(PROCESSED_MEMORIES[(activeIndex - 1 + PROCESSED_MEMORIES.length) % PROCESSED_MEMORIES.length].id); };

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.sky, overflow: 'hidden' }}>
      
      {/* ================= 3D WORLD RENDERER ================= */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 25, 10], fov: 50 }} dpr={[1, 1.5]} onPointerMissed={() => setActiveId(null)}>
          <fog attach="fog" args={[PALETTE.sky, 10, 40]} />
          
          <ambientLight intensity={0.5} color={PALETTE.lavender} />
          <hemisphereLight skyColor={PALETTE.peachGlow} groundColor={PALETTE.water} intensity={0.4} />
          
          <CinematicCamera activeId={activeId} introPhase={introPhase} />

          {/* Distant Magical Moon */}
          <mesh position={[0, 12, -40]}>
            <sphereGeometry args={[8, 32, 32]} />
            <meshBasicMaterial color={PALETTE.peachGlow} transparent opacity={0.9} />
          </mesh>
          <pointLight position={[0, 12, -38]} color={PALETTE.peachGlow} intensity={1.5} distance={50} />

          <group>
            {PROCESSED_MEMORIES.map((data) => (
              <RoyalFrame key={data.id} data={data} isActive={activeId === data.id} onClick={setActiveId} />
            ))}
          </group>

          <RiverBanks />
          <SakuraSwarm count={300} />
          <FireflyCluster count={80} />

          {/* Majestic Reflective River */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.0, -15]}>
            <planeGeometry args={[120, 120]} />
            <MeshReflectorMaterial 
              blur={[600, 200]} 
              resolution={512} 
              mixBlur={2} 
              mixStrength={25} 
              roughness={0.3} 
              color={PALETTE.water} 
              metalness={0.7} 
            />
          </mesh>

          <CinematicOptics activeId={activeId} introPhase={introPhase} />
        </Canvas>
      </div>

      {/* ================= 2D CINEMATIC UI LAYER ================= */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        
        {/* Soft Letterboxing for the Movie Feel */}
        <div style={{ position: 'absolute', top: 0, width: '100%', height: '15%', background: `linear-gradient(to bottom, rgba(10,8,22,0.95), transparent)` }} />
        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '20%', background: `linear-gradient(to top, rgba(10,8,22,0.98), transparent)` }} />

        {/* --- PHASE 1 & 2: THE TEXT INTRO --- */}
        <AnimatePresence>
          {introSequence === 0 && (
            <motion.div key="text1" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 2 }} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <h1 style={{ color: '#ffffff', fontFamily: 'serif', fontStyle: 'italic', fontSize: '2rem', letterSpacing: '0.1em', textShadow: '0 4px 20px rgba(0,0,0,1)' }}>Close your eyes...</h1>
            </motion.div>
          )}
          {introSequence === 1 && (
            <motion.div key="text2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 2 }} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <h1 style={{ color: PALETTE.peachGlow, fontFamily: 'serif', fontStyle: 'italic', fontSize: '2.2rem', letterSpacing: '0.05em', textShadow: '0 4px 20px rgba(0,0,0,1)' }}>And step into our world.</h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- PHASE 3: THE INTERACTIVE GARDEN --- */}
        <AnimatePresence>
          {introSequence === 2 && activeId === null && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 2, delay: 1 }} style={{ position: 'absolute', bottom: '8%', width: '100%', textAlign: 'center' }}>
               <p style={{ color: PALETTE.peachGlow, fontFamily: 'sans-serif', letterSpacing: '0.3em', fontSize: '10px', textTransform: 'uppercase', opacity: 0.8, textShadow: '0 2px 8px rgba(0,0,0,1)' }}>
                 Touch a memory to unfold it
               </p>
            </motion.div>
          )}

          {activeMemory && (
            <>
              {/* Glassmorphism Navigation Arrows */}
              <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.8, ease: "easeOut" }} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'auto' }} onClick={goToPrev}>
                <button style={{ background: 'rgba(255,218,185,0.08)', border: '1px solid rgba(255,218,185,0.2)', borderRadius: '50%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', backdropFilter: 'blur(12px)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={PALETTE.peachGlow} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.8, ease: "easeOut" }} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'auto' }} onClick={goToNext}>
                <button style={{ background: 'rgba(255,218,185,0.08)', border: '1px solid rgba(255,218,185,0.2)', borderRadius: '50%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', backdropFilter: 'blur(12px)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={PALETTE.peachGlow} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </motion.div>

              {/* Royal Caption Box */}
              <motion.div key="caption" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} transition={{ duration: 1, ease: "easeOut" }} style={{ position: 'absolute', bottom: '8%', width: '100%', textAlign: 'center', padding: '0 4.5rem' }}>
                <h2 style={{ color: '#ffffff', fontFamily: 'serif', fontStyle: 'italic', fontSize: '1.8rem', letterSpacing: '0.05em', margin: 0, textShadow: '0 4px 15px rgba(0,0,0,1)' }}>
                  {activeMemory.title}
                </h2>
                <div style={{ width: '40px', height: '1px', backgroundColor: PALETTE.roseGold, margin: '12px auto', opacity: 0.5 }} />
                <p style={{ color: PALETTE.peachGlow, fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.6 }}>
                  Tap anywhere to close
                </p>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Next Act Navigation */}
        <AnimatePresence>
          {introSequence === 2 && (
            <motion.button 
              onClick={() => onComplete()} 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2, delay: 2 }} 
              style={{ 
                position: 'absolute', top: '3.5rem', right: '1.5rem', 
                background: 'rgba(255,218,185,0.05)', border: '1px solid rgba(255,218,185,0.2)', borderRadius: '30px', 
                color: PALETTE.peachGlow, letterSpacing: '0.2em', fontSize: '10px', cursor: 'pointer', pointerEvents: 'auto',
                backdropFilter: 'blur(10px)', padding: '12px 24px', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
              whileTap={{ scale: 0.95 }}
            >
               {activeId !== null ? 'Continue' : 'Skip'} ➔
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Act2MemoryGarden;
