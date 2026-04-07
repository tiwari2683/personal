import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Acts
import Act1Invitation from './components/Acts/Act1Invitation';
import Act2MemoryGarden from './components/Acts/Act2MemoryGarden';
import Act3LoveLetter from './components/Acts/Act3LoveLetter';
import Act4Question from './components/Acts/Act4Question';
import Act5Bloom from './components/Acts/Act5Bloom';
import SparkleCursor from './components/Sensory/SparkleCursor';

import { CONFIG } from './config';
import { playMusic } from './utils/audio';

// ----------------------------------------------------------------------
// ANIMATED ROUTES WRAPPER (Cinematic Cross-Fade)
// ----------------------------------------------------------------------
const AnimatedRoutes = ({ tilt }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        
        {/* ACT 1: THE INVITATION */}
        <Route path="/" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} style={{ width: '100%', height: '100%' }}>
            <Act1Invitation onComplete={() => navigate('/garden')} tilt={tilt} />
          </motion.div>
        } />

        {/* ACT 2: THE MEMORY GARDEN */}
        <Route path="/garden" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} style={{ width: '100%', height: '100%' }}>
            <Act2MemoryGarden onComplete={() => navigate('/letter')} tilt={tilt} />
          </motion.div>
        } />

        {/* ACT 3: THE LOVE LETTER */}
        <Route path="/letter" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} style={{ width: '100%', height: '100%' }}>
            <Act3LoveLetter onComplete={() => navigate('/proposal')} />
          </motion.div>
        } />

        {/* ACT 4: THE QUESTION */}
        <Route path="/proposal" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} style={{ width: '100%', height: '100%' }}>
            <Act4Question onComplete={() => navigate('/bloom')} tilt={tilt} />
          </motion.div>
        } />

        {/* ACT 5: THE BLOOM */}
        <Route path="/bloom" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} style={{ width: '100%', height: '100%' }}>
            <Act5Bloom name={CONFIG.NAME} lastName={CONFIG.FUTURE_LAST_NAME} />
          </motion.div>
        } />

      </Routes>
    </AnimatePresence>
  );
};

// ----------------------------------------------------------------------
// MAIN APP ENTRY
// ----------------------------------------------------------------------
function App() {
  const [isAudioInitialized, setAudioInitialized] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Handle music start on first interaction (World Class Practice)
  const handleStart = () => {
    setAudioInitialized(true);
    playMusic();
  };

  // SENSORY: Tilt/Orientation Tracking (For Garden parallax)
  useEffect(() => {
    const handleMotion = (e) => {
      if (e.beta && e.gamma) {
        setTilt({ 
          x: (e.beta - 45) / 45, 
          y: e.gamma / 45 
        });
      }
    };
    window.addEventListener('deviceorientation', handleMotion);
    return () => window.removeEventListener('deviceorientation', handleMotion);
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div 
        className="fixed inset-0 overflow-hidden" 
        style={{ backgroundColor: 'black', width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
      >
        <SparkleCursor />
        <Suspense fallback={
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', backgroundColor: 'black' }}>
            <p style={{ letterSpacing: '0.3em', textTransform: 'uppercase', fontSize: '0.75rem', opacity: 0.5 }}>Loading her world...</p>
          </div>
        }>
          <AnimatedRoutes tilt={tilt} />
        </Suspense>

        {/* AUDIO GESTURE OVERLAY (Princess Safety) */}
        {!isAudioInitialized && (
          <div 
            onClick={handleStart}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              zIndex: 9999, 
              backgroundColor: 'rgba(0,0,0,0.01)', 
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
