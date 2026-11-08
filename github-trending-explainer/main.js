const Q = new URLSearchParams(location.search);
const g = document.getElementById('c').getContext('2d');
await Promise.all([400, 500, 600, 650].flatMap(w => [`${w} 40px Inter`, `${w} 40px InterTight`, `${w} 40px JBMono`]).map(f => document.fonts.load(f)));
const film = await import('./film.js');
film.setup(await (await fetch('repos.json')).json(), await (await fetch('timeline.json')).json());
window.DUR = film.DUR(); window.EV = film.events();
window.render = t => film.render(g, t, Q);
window.TEXTS = t => film.texts(g, t, Q);
window.READY = true;
