const Q = new URLSearchParams(location.search);
const g = document.getElementById('c').getContext('2d');
await Promise.all(['500 40px Inter', '600 40px Inter', '700 40px Inter', '800 40px Inter', '500 40px Caveat', '600 40px Caveat', '600 40px Cormorant', 'italic 500 40px Cormorant'].map(f => document.fonts.load(f)));
const film = await import('./film.js');
window.DUR = film.DUR; window.EV = film.events();
window.render = t => film.render(g, t, Q);
window.TEXTS = t => film.texts(g, t, Q);
window.READY = true;
