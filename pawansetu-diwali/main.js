const Q = new URLSearchParams(location.search);
const g = document.getElementById('c').getContext('2d');
for (const f of ['500 40px Cormorant', '600 40px Cormorant', '700 40px Cormorant', 'italic 500 40px Cormorant', '400 40px Tiro']) await document.fonts.load(f, f.includes('Tiro') ? 'शुभ दीपावली प' : 'Aa');
const film = await import('./film.js');
window.__g = g; window.DUR = film.DUR; window.EV = film.events();
window.render = t => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over'; film.render(g, t, Q); };
window.TEXTS = t => film.texts(t, Q);
window.READY = true;
