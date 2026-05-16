import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// ============================================================
// 🌌 THE CELESTIAL CORONATION — Birthday Finale
// A 5-phase cosmic cinematic experience beyond imagination.
// ============================================================

const COLORS = {
  gold: '#FFD700',
  roseGold: '#E8A0BF',
  champagne: '#F7E7CE',
  deepRose: '#C2185B',
  violet: '#7B2FBE',
  white: '#FFFFFF',
  peach: '#FFDAB9',
  cosmic: '#0D0221',
};

// ── PHASE 0: Triggered when "Step into the Light" is tapped ──
// ── PHASE 1: The Singularity — reality cracks with a blinding flash ──
// ── PHASE 2: Big Bang — gold particles explode from center ──
// ── PHASE 3: The name forms from stardust particles ──
// ── PHASE 4: Crown assembles, aurora floods the sky, confetti supernovae ──

// ============================================================
// CANVAS-BASED PARTICLE BIG BANG ENGINE
// ============================================================
const ParticleBigBang = ({ phase, onPhase3Ready }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const phaseRef = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate 800 particles from the Big Bang
    const COUNT = 800;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const goldShades = [
      '#FFD700', '#FFA500', '#FFE4B5', '#FFDAB9',
      '#E8A0BF', '#F7E7CE', '#FFFACD', '#FFF8DC'
    ];

    particlesRef.current = Array.from({ length: COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.3;
      const speed = 2 + Math.random() * 8;
      const life = 0.7 + Math.random() * 0.3;
      const size = 1 + Math.random() * 3;
      const trail = Math.random() > 0.7;

      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        friction: 0.96 + Math.random() * 0.02,
        alpha: life,
        maxAlpha: life,
        size,
        color: goldShades[Math.floor(Math.random() * goldShades.length)],
        trail,
        // Orbital parameters for Phase 3
        orbitAngle: angle,
        orbitRadius: 20 + Math.random() * Math.min(cx, cy) * 0.8,
        orbitSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.005),
        twinkle: Math.random() * Math.PI * 2,
        born: Date.now(),
      };
    });

    let frame = 0;
    const startTime = Date.now();

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      frame++;
      const elapsed = Date.now() - startTime;
      const currentPhase = phaseRef.current;

      // Clear with motion blur trail effect
      ctx.fillStyle = 'rgba(2, 1, 15, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.twinkle += 0.05;

        if (currentPhase === 'bang') {
          // EXPLOSIVE expansion
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= p.friction;
          p.vy *= p.friction;
          p.alpha *= 0.995;

          // Add gravity curl for beauty
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 50) {
            p.vx += (dx / dist) * 0.05;
            p.vy += (dy / dist) * 0.05;
          }
        } else if (currentPhase === 'orbit') {
          // Graceful orbital dance
          p.orbitAngle += p.orbitSpeed;
          const targetX = cx + Math.cos(p.orbitAngle) * p.orbitRadius;
          const targetY = cy + Math.sin(p.orbitAngle) * p.orbitRadius;
          p.x += (targetX - p.x) * 0.04;
          p.y += (targetY - p.y) * 0.04;
          p.alpha = p.maxAlpha * (0.6 + Math.sin(p.twinkle) * 0.4);
        } else if (currentPhase === 'dissolve') {
          // Dissolve outward gently
          p.x += p.vx * 0.3;
          p.y += p.vy * 0.3;
          p.alpha *= 0.97;
        }

        if (p.alpha < 0.01) return;

        // Glow effect
        const glowSize = p.size * (2 + Math.sin(p.twinkle) * 0.5);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize * 3);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.5, p.color + '88');
        gradient.addColorStop(1, 'transparent');

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core bright dot
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.globalAlpha = 1;
      });

      // Notify when orbital phase is stable
      if (currentPhase === 'orbit' && elapsed > 1200 && frame % 60 === 0) {
        onPhase3Ready?.();
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []); // Only mount once

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
  );
};

// ============================================================
// AURORA BACKGROUND CANVAS
// ============================================================
const AuroraBg = ({ active }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      t += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw layered aurora waves
      const waves = [
        { color1: 'rgba(180, 50, 120, ', color2: 'rgba(80, 0, 80, ', speed: 0.7, amp: 0.15, phase: 0 },
        { color1: 'rgba(255, 180, 100, ', color2: 'rgba(200, 80, 40, ', speed: 0.5, amp: 0.12, phase: 1.5 },
        { color1: 'rgba(120, 60, 200, ', color2: 'rgba(40, 0, 120, ', speed: 0.9, amp: 0.18, phase: 3 },
        { color1: 'rgba(255, 220, 150, ', color2: 'rgba(255, 150, 80, ', speed: 0.4, amp: 0.10, phase: 4.5 },
      ];

      waves.forEach((w, wi) => {
        const points = 80;
        for (let i = 0; i < points; i++) {
          const x = (i / points) * canvas.width;
          const baseY = canvas.height * (0.2 + wi * 0.18);
          const y = baseY + Math.sin(i * 0.15 + t * w.speed + w.phase) * canvas.height * w.amp
            + Math.cos(i * 0.08 + t * w.speed * 0.7) * canvas.height * w.amp * 0.5;

          const bandH = canvas.height * 0.18;
          const grad = ctx.createLinearGradient(x, y - bandH, x, y + bandH);
          grad.addColorStop(0, w.color1 + '0)');
          grad.addColorStop(0.5, w.color1 + '0.15)');
          grad.addColorStop(1, w.color2 + '0)');

          ctx.fillStyle = grad;
          ctx.fillRect(x, y - bandH, canvas.width / points + 1, bandH * 2);
        }
      });
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        zIndex: 1,
        opacity: active ? 1 : 0,
        transition: 'opacity 2s ease',
        pointerEvents: 'none',
      }}
    />
  );
};

// ============================================================
// SHOCKWAVE RING EFFECT
// ============================================================
const ShockwaveRings = ({ trigger }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxR = Math.max(cx, cy) * 2;

    const rings = [
      { r: 0, speed: 8, alpha: 0.9, color: '#FFD700', width: 3 },
      { r: 0, speed: 5, alpha: 0.6, color: '#E8A0BF', width: 5 },
      { r: 0, speed: 3, alpha: 0.4, color: '#FFFFFF', width: 8 },
      { r: 0, speed: 12, alpha: 0.3, color: '#F7E7CE', width: 2 },
    ];

    let done = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDone = true;

      rings.forEach((ring) => {
        if (ring.r > maxR) return;
        allDone = false;
        ring.r += ring.speed;
        const progress = ring.r / maxR;
        const alpha = ring.alpha * (1 - progress);

        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.width;
        ctx.globalAlpha = alpha;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      if (!allDone) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
};

// ============================================================
// STAR STREAKS (Warp Speed Moment)
// ============================================================
const StarStreaks = ({ active }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const stars = Array.from({ length: 300 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 50;
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        angle,
        r,
        speed: 8 + Math.random() * 20,
        length: 5 + Math.random() * 40,
        alpha: 0.5 + Math.random() * 0.5,
        color: ['#FFD700', '#FFFFFF', '#FFDAB9', '#E8A0BF'][Math.floor(Math.random() * 4)],
      };
    });

    let frame = 0;
    const animate = () => {
      if (frame > 80) return; // Only 80 frames of warp
      animRef.current = requestAnimationFrame(animate);
      frame++;

      ctx.fillStyle = 'rgba(2, 1, 15, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((s) => {
        s.r += s.speed;
        s.x = cx + Math.cos(s.angle) * s.r;
        s.y = cy + Math.sin(s.angle) * s.r;

        const fadeOut = Math.max(0, 1 - frame / 80);

        ctx.beginPath();
        ctx.moveTo(
          cx + Math.cos(s.angle) * (s.r - s.length),
          cy + Math.sin(s.angle) * (s.r - s.length)
        );
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = s.alpha * fadeOut;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        zIndex: 3,
        pointerEvents: 'none',
      }}
    />
  );
};

// ============================================================
// ANIMATED CROWN OF LIGHT (SVG + CSS)
// ============================================================
const CrownOfLight = ({ visible }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.3, y: -40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <svg width="100" height="70" viewBox="0 0 100 70" fill="none">
            {/* Crown body */}
            <motion.path
              d="M10,60 L10,30 L30,10 L50,35 L70,10 L90,30 L90,60 Z"
              fill="none"
              stroke="url(#crownGrad)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
            />
            {/* Crown base line */}
            <motion.line
              x1="8" y1="60" x2="92" y2="60"
              stroke="url(#crownGrad)"
              strokeWidth="2.5"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ transformOrigin: '50px 60px' }}
              transition={{ duration: 0.8, delay: 1.5 }}
            />
            {/* Jewels */}
            {[
              { cx: 30, cy: 10, r: 4, delay: 1.8, color: '#E8A0BF' },
              { cx: 50, cy: 35, r: 5, delay: 2.0, color: '#FFD700' },
              { cx: 70, cy: 10, r: 4, delay: 2.2, color: '#E8A0BF' },
            ].map((jewel, i) => (
              <motion.circle
                key={i}
                cx={jewel.cx} cy={jewel.cy} r={jewel.r}
                fill={jewel.color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }}
                style={{ transformOrigin: `${jewel.cx}px ${jewel.cy}px` }}
                transition={{ duration: 0.6, delay: jewel.delay }}
              />
            ))}
            {/* Gradient def */}
            <defs>
              <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#F7E7CE" />
                <stop offset="100%" stopColor="#E8A0BF" />
              </linearGradient>
            </defs>
          </svg>
          {/* Halo glow ring */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '10px', left: '50%',
              transform: 'translateX(-50%)',
              width: '80px', height: '50px',
              borderRadius: '50%',
              boxShadow: '0 0 30px 10px rgba(255, 215, 0, 0.4), 0 0 60px 20px rgba(232, 160, 191, 0.2)',
              pointerEvents: 'none',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// FLOATING SPARKLE ORBS
// ============================================================
const FloatingOrbs = ({ visible }) => {
  const orbs = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: 4 + Math.random() * 8,
    x: 5 + Math.random() * 90,
    y: 10 + Math.random() * 80,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 3,
    color: ['#FFD700', '#E8A0BF', '#FFDAB9', '#F7E7CE', '#FFFFFF'][Math.floor(Math.random() * 5)],
  }));

  return (
    <AnimatePresence>
      {visible && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
          {orbs.map((orb) => (
            <motion.div
              key={orb.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0.4, 0.9, 0],
                scale: [0, 1, 0.8, 1.2, 0],
                y: [0, -30, -60, -20, -80],
              }}
              transition={{
                duration: orb.duration,
                delay: orb.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                left: `${orb.x}%`,
                top: `${orb.y}%`,
                width: orb.size,
                height: orb.size,
                borderRadius: '50%',
                backgroundColor: orb.color,
                boxShadow: `0 0 ${orb.size * 2}px ${orb.color}`,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// MAIN BIRTHDAY FINALE COMPONENT
// ============================================================
const BirthdayFinale = ({ name, onComplete }) => {
  const [phase, setPhase] = useState('flash');      // flash → bang → orbit → text → crown
  const [particlePhase, setParticlePhase] = useState('bang');
  const [showFlash, setShowFlash] = useState(true);
  const [showWarp, setShowWarp] = useState(false);
  const [showAurora, setShowAurora] = useState(false);
  const [showCrown, setShowCrown] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showOrbs, setShowOrbs] = useState(false);
  const [shockwave, setShockwave] = useState(false);
  const [phase3Ready, setPhase3Ready] = useState(false);

  // Master timeline conductor
  useEffect(() => {
    const timeline = [
      // Phase 1: Flash + Warp
      { t: 0,    fn: () => { setShowFlash(true); setShowWarp(true); setShockwave(true); } },
      { t: 400,  fn: () => { setShowFlash(false); } },
      { t: 600,  fn: () => { setParticlePhase('bang'); } },
      // Phase 2: Particles explode
      { t: 1800, fn: () => { setParticlePhase('orbit'); setShowAurora(true); } },
      // Phase 3: Text emerges
      { t: 2800, fn: () => { setShowText(true); setShowOrbs(true); } },
      // Phase 4: Crown assembles
      { t: 4500, fn: () => { setShowCrown(true); fireConfettiSuperNova(); } },
      // Phase 5: Button reveals
      { t: 6500, fn: () => { setShowButton(true); setParticlePhase('dissolve'); } },
    ];

    const timers = timeline.map(({ t, fn }) => setTimeout(fn, t));
    return () => timers.forEach(clearTimeout);
  }, []);

  // 🎆 The Confetti Supernova — 7 synchronized cannon bursts
  const fireConfettiSuperNova = useCallback(() => {
    const duration = 5000;
    const end = Date.now() + duration;

    // Heart burst from center
    const heartShape = confetti.shapeFromText({ text: '🩷', scalar: 2 });
    const starShape = confetti.shapeFromText({ text: '⭐', scalar: 1.5 });

    confetti({
      particleCount: 120,
      spread: 360,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#FFD700', '#E8A0BF', '#FFDAB9', '#F7E7CE', '#FFFFFF'],
      ticks: 200,
      shapes: [heartShape],
      scalar: 2,
    });

    // Staggered cannon volleys
    const cannonAngles = [
      { x: 0.1, y: 0.6, angle: 60 },
      { x: 0.9, y: 0.6, angle: 120 },
      { x: 0.2, y: 0.9, angle: 70 },
      { x: 0.8, y: 0.9, angle: 110 },
      { x: 0.5, y: 1.0, angle: 90 },
    ];

    cannonAngles.forEach(({ x, y, angle }, i) => {
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle,
          spread: 55,
          startVelocity: 60,
          origin: { x, y },
          colors: ['#FFD700', '#E8A0BF', '#F7E7CE', '#FFFFFF', '#C2185B'],
          ticks: 300,
          shapes: [starShape, 'circle'],
          scalar: 1.2,
        });
      }, i * 300);
    });

    // Continuous gold shimmer rain
    const shimmerInterval = setInterval(() => {
      if (Date.now() > end) return clearInterval(shimmerInterval);
      confetti({
        particleCount: 15,
        angle: 90,
        spread: 120,
        startVelocity: 20,
        origin: { x: Math.random(), y: 0 },
        colors: ['#FFD700', '#FFF8DC', '#FFDAB9'],
        ticks: 250,
        gravity: 0.4,
        drift: (Math.random() - 0.5) * 0.5,
      });
    }, 200);
  }, []);

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        backgroundColor: '#02010F',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* ── LAYER 1: Living Aurora sky ── */}
      <AuroraBg active={showAurora} />

      {/* ── LAYER 2: Big Bang Particle Canvas ── */}
      <ParticleBigBang
        phase={particlePhase}
        onPhase3Ready={() => setPhase3Ready(true)}
      />

      {/* ── LAYER 3: Star warp streaks ── */}
      <StarStreaks active={showWarp} />

      {/* ── LAYER 4: Shockwave rings ── */}
      <ShockwaveRings trigger={shockwave} />

      {/* ── LAYER 5: Floating sparkle orbs ── */}
      <FloatingOrbs visible={showOrbs} />

      {/* ── LAYER 6: Blinding Flash ── */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.6, times: [0, 0.1, 0.5, 1] }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle, #FFFDE7 0%, #FFD700 30%, #F7E7CE 60%, #02010F 100%)',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── LAYER 7: The Text — assembled from the cosmos ── */}
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 8,
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <AnimatePresence>
          {showText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Crown above text */}
              <CrownOfLight visible={showCrown} />

              {/* "Happy Birthday" line */}
              <motion.div
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                }}
              >
                {'Happy Birthday'.split(' ').map((word, wi) => (
                  <motion.span
                    key={wi}
                    initial={{ opacity: 0, y: 60, filter: 'blur(20px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{
                      duration: 1.2,
                      delay: wi * 0.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      display: 'inline-block',
                      fontFamily: '"Cormorant Garamond", "Georgia", serif',
                      fontSize: 'clamp(2rem, 10vw, 3.5rem)',
                      fontStyle: 'italic',
                      fontWeight: '300',
                      background: 'linear-gradient(135deg, #FFD700 0%, #F7E7CE 50%, #E8A0BF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: 'none',
                      letterSpacing: '0.05em',
                      filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.6))',
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>

              {/* Divider light glyph */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                style={{
                  margin: '0.6rem auto',
                  width: '100px',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, #FFD700, #E8A0BF, transparent)',
                  boxShadow: '0 0 8px rgba(255,215,0,0.8)',
                }}
              />

              {/* "my Princess, Ritam" */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, filter: 'blur(15px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.5, delay: 1.0, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ marginBottom: '0.25rem' }}
              >
                <span
                  style={{
                    fontFamily: '"Cormorant Garamond", "Georgia", serif',
                    fontSize: 'clamp(2.2rem, 11vw, 4rem)',
                    fontStyle: 'italic',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFDAB9 40%, #FFD700 70%, #E8A0BF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.02em',
                    filter: 'drop-shadow(0 0 30px rgba(255,218,185,0.8)) drop-shadow(0 0 60px rgba(255,215,0,0.4))',
                  }}
                >
                  my Princess,
                </span>
              </motion.div>

              {/* Name with pulsing glow */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 1.8 }}
              >
                <motion.span
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(255,215,0,0.4)',
                      '0 0 40px rgba(255,215,0,0.9), 0 0 80px rgba(232,160,191,0.6)',
                      '0 0 20px rgba(255,215,0,0.4)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    fontFamily: '"Cormorant Garamond", "Georgia", serif',
                    fontSize: 'clamp(2rem, 10vw, 3.8rem)',
                    fontStyle: 'italic',
                    fontWeight: '300',
                    color: '#FFFFFF',
                    letterSpacing: '0.08em',
                  }}
                >
                  {name}.
                </motion.span>
              </motion.div>

              {/* Subtitle: floating upward */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.7, y: 0 }}
                transition={{ duration: 1.5, delay: 2.8 }}
                style={{
                  marginTop: '1.5rem',
                  fontFamily: '"Cormorant Garamond", "Georgia", serif',
                  fontSize: 'clamp(0.7rem, 3vw, 0.9rem)',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  color: '#E8A0BF',
                  fontStyle: 'normal',
                }}
              >
                The universe paused to celebrate you.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── LAYER 8: The Portal Button ── */}
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              bottom: '8%',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            {/* Portal ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: '240px', height: '60px',
                borderRadius: '30px',
                background: 'conic-gradient(from 0deg, #FFD700, #E8A0BF, #FFDAB9, #FFD700)',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <motion.button
              onClick={onComplete}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255,215,0,0.3)',
                  '0 0 40px rgba(255,215,0,0.7), 0 0 80px rgba(232,160,191,0.4)',
                  '0 0 20px rgba(255,215,0,0.3)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: 'relative',
                background: 'rgba(2, 1, 15, 0.9)',
                border: '2px solid rgba(255, 215, 0, 0.6)',
                borderRadius: '30px',
                color: '#FFD700',
                letterSpacing: '0.3em',
                fontSize: '11px',
                cursor: 'pointer',
                backdropFilter: 'blur(20px)',
                padding: '18px 40px',
                textTransform: 'uppercase',
                fontFamily: 'sans-serif',
                zIndex: 1,
              }}
            >
              Enter Your Kingdom ✦
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Font import */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,600;1,700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
};

export default BirthdayFinale;
