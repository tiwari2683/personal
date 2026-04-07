import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';

import ParticleSimulationMaterial from '../../shaders/ParticleSimulationMaterial';
import ParticleRenderMaterial from '../../shaders/ParticleRenderMaterial';

extend({ ParticleSimulationMaterial, ParticleRenderMaterial });

const GPGPUSwarm = ({ count = 128, color = '#FFD700', isVisible = true }) => {
  const size = count; // 128x128 = 16,384 particles
  const pointsRef = useRef();
  const simRef = useRef();
  
  const { gl } = useThree();

  // 1. Create Initial Data Textures
  const [positionsTexture, targetsTexture] = useMemo(() => {
    const posData = new Float32Array(size * size * 4);
    const targetData = new Float32Array(size * size * 4);

    for (let i = 0; i < size * size; i++) {
      // Random initial positions (dispersed cloud)
      posData[i * 4 + 0] = (Math.random() - 0.5) * 10;
      posData[i * 4 + 1] = (Math.random() - 0.5) * 10;
      posData[i * 4 + 2] = (Math.random() - 0.5) * 5;
      posData[i * 4 + 3] = 1;

      // Heart Shape Logic for Targets
      const t = Math.random() * Math.PI * 2;
      const r = 0.15; // Scale
      // Heart Formula: x = 16sin^3(t), y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      
      targetData[i * 4 + 0] = x * r;
      targetData[i * 4 + 1] = y * r + 0.5; // Offset slightly up
      targetData[i * 4 + 2] = (Math.random() - 0.5) * 0.5; // Slight depth
      targetData[i * 4 + 3] = 1;
    }

    const posTex = new THREE.DataTexture(posData, size, size, THREE.RGBAFormat, THREE.FloatType);
    posTex.needsUpdate = true;
    
    const tarTex = new THREE.DataTexture(targetData, size, size, THREE.RGBAFormat, THREE.FloatType);
    tarTex.needsUpdate = true;

    return [posTex, tarTex];
  }, [size]);

  // 2. Create FBOs (Ping-Pong buffers)
  const targetA = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });
  const targetB = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });

  // 3. Helper Mesh for Simulation (not rendered to screen)
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const simMesh = useMemo(() => {
    return (
      <mesh>
        <planeGeometry args={[2, 2]} />
        <particleSimulationMaterial 
          ref={simRef} 
          uPositions={positionsTexture} 
          uTargets={targetsTexture}
        />
      </mesh>
    );
  }, [positionsTexture, targetsTexture]);

  // 4. Points Mesh Geometry (UVs map to the FBO texture)
  const [particlesUv] = useMemo(() => {
    const uv = new Float32Array(size * size * 2);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        uv[i * 2 + 0] = x / (size - 1);
        uv[i * 2 + 1] = y / (size - 1);
      }
    }
    return [uv];
  }, [size]);

  // 5. Animation Loop
  useFrame((state, delta) => {
    const { gl, clock, mouse } = state;

    // Step A: Update Simulation Uniforms
    simRef.current.uTime = clock.elapsedTime;
    simRef.current.uDelta = delta;
    simRef.current.uMorphProgress = isVisible ? 1.0 : 0.0;
    
    // Map mouse [-1, 1] to scene coordinates
    simRef.current.uPointer.set(mouse.x * 5, mouse.y * 3, 0);

    // Step B: Ping-Pong Render
    const currentTarget = clock.getElapsedTime() % 2 < 1 ? targetA : targetB; // Simplified toggle
    // Actually standard toggle:
    const read = state.frame % 2 === 0 ? targetA : targetB;
    const write = state.frame % 2 === 0 ? targetB : targetA;

    simRef.current.uPositions = read.texture;
    
    gl.setRenderTarget(write);
    gl.render(simMesh, camera);
    gl.setRenderTarget(null);

    // Step C: Update Render Material
    pointsRef.current.material.uPositions = write.texture;
    pointsRef.current.material.uTime = clock.elapsedTime;
    pointsRef.current.material.uOpacity = THREE.MathUtils.lerp(pointsRef.current.material.uOpacity, isVisible ? 1 : 0, 0.05);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particlesUv.length / 2} array={new Float32Array(particlesUv.length / 2 * 3)} itemSize={3} />
        <bufferAttribute attach="attributes-uv" count={particlesUv.length / 2} array={particlesUv} itemSize={2} />
      </bufferGeometry>
      <particleRenderMaterial 
        transparent 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
        uColor={new THREE.Color(color)}
        uPointSize={isVisible ? 1.2 : 0}
      />
    </points>
  );
};

export default GPGPUSwarm;
