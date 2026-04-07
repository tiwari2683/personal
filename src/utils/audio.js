import { Howl } from 'howler';
import { CONFIG } from '../config';

// ----------------------------------------------------------------------
// WORLD CLASS AUDIO SINGLETON
// Ensures exactly one audio instance regardless of HMR or re-renders.
// ----------------------------------------------------------------------

let globalMusic = null;

export const getMusic = () => {
  if (!globalMusic) {
    globalMusic = new Howl({
      src: [CONFIG.SONG_PATH],
      html5: true,
      loop: true,
      volume: 0.5,
      autoplay: false,
    });
  }
  return globalMusic;
};

export const playMusic = () => {
  const music = getMusic();
  if (!music.playing()) {
    music.play();
  }
};

export const pauseMusic = () => {
  const music = getMusic();
  music.pause();
};
