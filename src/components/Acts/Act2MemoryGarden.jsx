import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONFIG } from '../../config';

// Background Particles Component (Hearts and Flowers diverging)
const FloatingParticles = () => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const arr = Array.from({ length: 30 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      // Distance from center: between 150px and 450px
      const distance = 150 + Math.random() * 300;
      return {
        id: i,
        emoji: ['🌸', '🌺', '💖', '✨', '❤️', '🌹', '💕'][Math.floor(Math.random() * 7)],
        endX: Math.cos(angle) * distance,
        endY: Math.sin(angle) * distance,
        delay: Math.random() * 4,
        duration: 6 + Math.random() * 6,
        scale: 0.6 + Math.random() * 1.2,
        rot: (Math.random() - 0.5) * 360
      };
    });
    setParticles(arr);
  }, []);

  return (
    <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1, pointerEvents: 'none' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            x: p.endX,
            y: p.endY,
            opacity: [0, 0.9, 0.9, 0],
            scale: [0, p.scale, p.scale * 0.8],
            rotate: p.rot
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut"
          }}
          style={{ position: 'absolute', fontSize: '1.2rem', textShadow: '0 0 10px rgba(0,0,0,0.5)' }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
};

const Act2MemoryGarden = ({ onComplete }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const memories = CONFIG.MEMORIES;

  // Preload all images so they fade in instantly
  useEffect(() => {
    memories.forEach(m => {
      const img = new Image();
      img.src = m.image;
    });
  }, [memories]);

  const handleNext = () => {
    if (isTransitioning) return;
    
    if (activeIndex < memories.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 1000); // Wait for the light pulse animation before revealing next
    } else {
      onComplete();
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: '#020308', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Deep Space Vignette Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(15,10,25,1) 0%, rgba(2,3,8,1) 100%)', pointerEvents: 'none' }} />
      
      {/* =========================================
          THE GOLDEN THREAD (Background Line)
      ========================================= */}
      <motion.div 
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ 
          position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', 
          background: 'linear-gradient(to bottom, rgba(255,215,0,0), rgba(255,215,0,0.5), rgba(255,215,0,0))',
          boxShadow: '0 0 15px rgba(255,215,0,0.3)',
          transform: 'translateX(-50%)', zIndex: 0 
        }} 
      />

      {/* Traveling Pulse of Light (Shooting Star Effect) */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ top: '10%', opacity: 0 }}
            animate={{ top: '120%', opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.5, 0, 0.75, 0] }}
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* The Leading Star / Glowing Orb */}
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 20px 10px rgba(255, 215, 0, 0.8), 0 0 40px 20px rgba(255, 215, 0, 0.4)'
            }} />
            
            {/* The Trailing Magic Dust */}
            <div style={{
              width: '2px',
              height: '40vh',
              background: 'linear-gradient(to top, rgba(255,215,0,0.9) 0%, rgba(255,215,0,0) 100%)',
              filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.8))'
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static softly glowing aura behind the active photo */}
      <motion.div
        animate={{ opacity: isTransitioning ? 0 : 0.4, scale: isTransitioning ? 0.8 : 1 }}
        transition={{ duration: 1 }}
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* =========================================
          MEMORY CONTENT (Foreground)
      ========================================= */}
      {/* =========================================
          MEMORY CONTENT (Foreground)
      ========================================= */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        width: '100%', 
        maxWidth: '800px', 
        height: '100dvh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        paddingTop: '8dvh' // Fixed top start point
      }}>
        
        <AnimatePresence mode="wait">
          {!isTransitioning && (
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.9, y: 30 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, y: 0 }}
              exit={{ opacity: 0, filter: 'blur(15px)', scale: 1.05, y: -20 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', position: 'relative' }}
            >
              
              {/* Diverging Background Emojis */}
              <FloatingParticles />

              {/* The Framed Memory */}
              <div style={{ 
                position: 'relative',
                zIndex: 5,
                width: '80%', 
                maxWidth: '280px', // Slightly smaller to ensure fit
                aspectRatio: '3/4',
                borderRadius: '8px',
                padding: '6px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,215,0,0.15)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,215,0,0.05)',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                flexShrink: 0 // Prevent photo from being squashed
              }}>
                <img 
                  src={memories[activeIndex].image} 
                  alt="Memory" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    borderRadius: '4px', 
                    filter: 'brightness(0.95) contrast(1.05)',
                    opacity: 0.95
                  }} 
                />
                
                {/* Vintage Glass Reflection Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 100%)',
                  pointerEvents: 'none',
                  borderRadius: '8px'
                }} />
              </div>

              {/* The Suspenseful Caption Reveal (Strict Scrollable Area) */}
              <div 
                style={{ 
                  marginTop: '1.5rem', 
                  width: '90%', 
                  maxWidth: '450px', 
                  position: 'relative', 
                  zIndex: 10,
                  height: '25vh', // Fixed height to force scroll if text is long
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div 
                  className="caption-scroll"
                  style={{ 
                    textAlign: 'center', 
                    padding: '0 10px 20px 10px', 
                    width: '100%', 
                    height: '100%',
                    overflowY: 'auto',
                    pointerEvents: 'auto',
                    touchAction: 'pan-y',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <h2 style={{ 
                    fontFamily: '"Cormorant Garamond", serif', 
                    fontSize: 'clamp(1.1rem, 4.5vw, 1.4rem)', 
                    color: '#f7e7ce', 
                    fontStyle: 'italic',
                    fontWeight: 300,
                    lineHeight: 1.6,
                    letterSpacing: '0.03em',
                    margin: 0,
                    wordBreak: 'break-word', // Force wrapping of long strings like dots
                    overflowWrap: 'break-word',
                    textShadow: '0 4px 15px rgba(0,0,0,1)'
                  }}>
                    "{memories[activeIndex].caption}"
                  </h2>
                  <div style={{ width: '30px', height: '1px', backgroundColor: 'rgba(255,215,0,0.3)', margin: '20px auto 0 auto' }} />
                </div>
                
                {/* Subtle fade at bottom to indicate more text */}
                <div style={{ 
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px', 
                  background: 'linear-gradient(to top, #020308, transparent)', 
                  pointerEvents: 'none', zIndex: 11 
                }} />
              </div>
              
              <style>{`
                .caption-scroll::-webkit-scrollbar { width: 3px; }
                .caption-scroll::-webkit-scrollbar-track { background: transparent; }
                .caption-scroll::-webkit-scrollbar-thumb { background: rgba(255, 215, 0, 0.2); border-radius: 10px; }
              `}</style>

            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================
            NAVIGATION / NEXT NODE (Fixed at Bottom)
        ========================================= */}
        <AnimatePresence>
          {!isTransitioning && (
            <motion.button
              onClick={handleNext}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 3, duration: 1 }}
              style={{
                position: 'absolute',
                bottom: '5dvh', // Use dvh for consistent mobile spacing
                background: 'rgba(10,8,22,0.8)', // Darker for better contrast
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '30px',
                color: '#ffd700',
                padding: '14px 32px',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.2em',
                fontSize: '10px',
                textTransform: 'uppercase',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 100
              }}
              whileHover={{ scale: 1.05, borderColor: 'rgba(255,215,0,0.5)', backgroundColor: 'rgba(255,215,0,0.1)' }}
              whileTap={{ scale: 0.95 }}
            >
              {activeIndex < memories.length - 1 ? 'Follow the Thread' : 'Continue Journey'}
              <motion.span animate={{ y: [0, 3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                ↓
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Act2MemoryGarden;
