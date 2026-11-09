// One clock: chapters, voice, captions. Reused chapters come from clips/*.mp4 (tools/excerpts.sh).
export const DUR = 64.0;
export const CH = [
  { id: 'title', t0: 0, t1: 5.2, style: 'Swiss Motion Graphics', cat: 'Graphic & Type' },
  { id: 'water', t0: 5.2, t1: 12.4, style: 'Watercolor Brush', cat: 'Hand-drawn & Painting' },
  { id: 'silent', t0: 12.4, t1: 18.4, style: '1920s Silent Film', cat: 'Cinema & Eras' },
  { id: 'glass', t0: 18.4, t1: 24.9, style: 'Glass Product Render', cat: 'Materials & 3D', clip: 'glass' },
  { id: 'riso', t0: 24.9, t1: 30.9, style: 'Risograph Print', cat: 'Print & Printmaking' },
  { id: 'cartoon', t0: 30.9, t1: 37.4, style: 'Mid-century Cartoon', cat: 'Cartoon & Anime', clip: 'cartoon' },
  { id: 'iso', t0: 37.4, t1: 43.4, style: 'Isometric Infographic', cat: 'Information & Keynote', clip: 'iso' },
  { id: 'pixel', t0: 43.4, t1: 50.4, style: '16-bit Pixel RPG', cat: 'Games' },
  { id: 'lantern', t0: 50.4, t1: 56.3, style: 'Paper-cut Lightbox', cat: 'East Asian Traditions', clip: 'lantern' },
  { id: 'end', t0: 56.3, t1: DUR, style: 'Swiss Motion Graphics', cat: 'Graphic & Type' },
];
export const VO = [
  { id: 'T', t: .5, t1: 5.0, text: 'One day at a local shop. Nine ways to tell it.' },
  { id: 'W', t: 5.7, t1: 12.2, text: 'Five thirty. Before the street wakes, the shutter goes up.' },
  { id: 'G', t: 18.9, t1: 24.7, text: 'Eleven. A new arrival, straight into the glass case.' },
  { id: 'R', t: 25.4, t1: 30.7, text: "One o'clock. The lunch rush." },
  { id: 'M', t: 31.4, t1: 37.2, text: 'Three. A neighbour orders from her phone.' },
  { id: 'I', t: 37.9, t1: 43.2, text: 'The order crosses two streets, and arrives in minutes.' },
  { id: 'P', t: 43.9, t1: 50.2, text: 'Six. The after-school quest for sweets.' },
  { id: 'L', t: 50.8, t1: 56.2, text: 'Nine. The street goes quiet. One lamp stays lit.' },
  { id: 'E', t: 56.8, t1: 63.4, text: 'One shop. One day. Now online, with PawanSetu.' },
];
