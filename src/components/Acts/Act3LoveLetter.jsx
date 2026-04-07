import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CONFIG } from '../../config';

gsap.registerPlugin(ScrollTrigger);

const Act3LoveLetter = ({ onComplete }) => {
  const containerRef = useRef();
  const textRef = useRef();
  const scrollPromptRef = useRef();

  useEffect(() => {
    const words = textRef.current.children;
    
    // GSAP Scroll animation: Rhythmic reveal
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=2000",
        scrub: 1,
        pin: true,
        onLeave: () => {
           setTimeout(onComplete, 1000);
        }
      }
    });

    tl.fromTo(words, 
      { opacity: 0.2, y: 30, filter: 'blur(10px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        stagger: 0.2,
        duration: 1
      }
    );

    // Initial Fade-in of the entire container
    gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1.5 });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [onComplete]);

  const letterLines = CONFIG.LOVE_LETTER.split(' ');

  return (
    <div ref={containerRef} style={{ 
      position: 'absolute', 
      inset: 0, 
      backgroundColor: 'var(--royal-peach)', 
      overflowY: 'auto', 
      overflowX: 'hidden',
      zIndex: 1
    }}>
      {/* PRINCESS THEME: BIRMINGHAM PALACE MOTIF */}
      <div className="bg-palace" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* SCROLL TRACKER AREA */}
      <div style={{ height: '3000px', width: '100%', position: 'relative' }}>
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '2rem',
          pointerEvents: 'none',
          zIndex: 2
        }}>
          <div ref={textRef} style={{ textAlign: 'center', maxWidth: '36rem' }}>
            {letterLines.map((word, i) => (
              <span 
                key={i} 
                className="title-glow"
                style={{ 
                  display: 'inline-block', 
                  marginRight: '0.75rem', 
                  marginBottom: '1rem',
                  fontSize: '2rem',
                  lineHeight: '1.4',
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  color: 'var(--liquid-gold-start)',
                  opacity: 0.2,
                  transition: 'opacity 0.5s ease',
                  textShadow: '0 0 15px rgba(212, 175, 55, 0.1)'
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* FLOATY PRINCESS ACCENTS - SCROLL PROMPT */}
      <div 
        ref={scrollPromptRef}
        className="animate-bounce"
        style={{ 
          position: 'fixed', 
          bottom: '4rem', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          opacity: 0.6, 
          pointerEvents: 'none',
          textAlign: 'center',
          zIndex: 10
        }}
      >
         <p style={{ 
            fontSize: '0.65rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.4em', 
            color: 'var(--liquid-gold-start)',
            marginBottom: '10px'
         }}>Scroll to reveal my heart</p>
         <div style={{ width: '1px', height: '40px', background: 'var(--liquid-gold-start)', margin: '0 auto' }}></div>
      </div>
    </div>
  );
};

export default Act3LoveLetter;
