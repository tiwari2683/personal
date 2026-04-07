3/**
 * [NAME]'S EXPERIENCE CONFIGURATION
 * The beating heart of the "Princess-worthy" world.
 */

export const CONFIG = {
  // PERSONAL DETAILS (Placeholder - user will fill these)
  NAME: "Ritam",
  FUTURE_LAST_NAME: "Smith",
  COLOR: {
    PRIMARY: "hsl(25, 100%, 94%)", // Royal Peach (Princess-safe)
    SECONDARY: "hsl(45, 100%, 90%)", // Champagne
    ACCENT: "hsl(43, 50%, 50%)", // Liquid Gold
    AURORA: "hsl(160, 100%, 90%)", // Aurora Mint (Northern Lights)
  },

  // SENSORY
  FAVORITE_FLOWER: "rose", // rose, jasmine, sunflower, lily
  SONG_PATH: "/audio/song.mp3",
  AMBIENT_PATH: "/audio/ambient.mp3", // Soft piano/celeste

  // MEMORIES (5 total)
  MEMORIES: [
    { id: 1, image: "/memories/1.jpeg", caption: "The day we met. Everything changed." },
    { id: 2, image: "/memories/2.jpeg", caption: "The way you smile when you're thinking of us." },
    { id: 3, image: "/memories/3.jpeg", caption: "Radiant. That's you." },
    { id: 4, image: "/memories/4.jpeg", caption: "Our first sunset together." },
    { id: 5, image: "/memories/5.jpeg", caption: "Forever starts now." },
  ],

  // LOVE LETTER (Act 3)
  LOVE_LETTER: "Ritam, every moment with you feels like a beautiful dream I never want to wake from. Your smile is my northern star, and your love is the anchor of my life. From our first meeting to this very second, you have redefined what happiness means to me. I built this world for you, because you are my whole world. Happy Birthday, my Princess.",

  // PROPOSAL
  PROPOSAL_SENTENCE: "Will you make me the happiest person and be mine forever?",

  // ANIMATION TIMING (halved by default for "slowness is power")
  TIMING: {
    SLOW: 2000,
    VERY_SLOW: 4000,
    BREATH: 6000,
  }
};
