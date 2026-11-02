/* Copertina, indice, bandiere e glossario: tutto dentro il libro, anche in VR */
(function () {
  const { C } = Pagina;
  const { CAPITOLI, LEZIONI, PRONTE, stato } = Libro;

  function disegnaCopertina(c, W, H) {
    c.fillStyle = '#0B2545'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#C9A227'; c.lineWidth = 7; c.strokeRect(46, 46, W - 92, H - 92);
    c.lineWidth = 2; c.strokeRect(66, 66, W - 132, H - 132);
    c.fillStyle = '#E3C878'; c.textAlign = 'center';
    c.font = '700 160px Bitter, Georgia, serif'; c.fillText('La nave', W / 2, 330);
    c.font = '64px Disegno, cursive'; c.fillText('quaderno di bordo', W / 2, 430);
    c.drawImage(Stemma.img, W / 2 - 330, 520, 660, 660);
    c.font = '700 44px Atkinson, sans-serif'; c.fillStyle = '#EEF2F8'; c.fillText('Tocca per aprire', W / 2, 1400);
    c.textAlign = 'left';
  }

  Motore.sezione('copertina', {
    spreads: () => [
      { chiuso: true, dx: [{ t: 'fondo', fn: disegnaCopertina, id: 'sez:indice:0' }] },
    ],
  });

  const capitolo = (cap) => [
    { t: 'sotto', testo: `${cap.n}. ${cap.titolo}` },
    ...cap.lezioni.map((n) => ({
      t: 'voce', n, id: `sez:${n}:0`, pronta: PRONTE.includes(n), fatta: stato(n).bandiera,
      testo: PRONTE.includes(n) ? LEZIONI[n] : `${LEZIONI[n]} (in preparazione)`,
    })),
    { t: 'spazio', h: 18 },
  ];

  Motore.sezione('indice', {
    spreads: () => [{
      sx: [
        { t: 'titolo', testo: 'Indice' },
        ...CAPITOLI.slice(0, 3).flatMap(capitolo),
      ],
      dx: [
        ...CAPITOLI.slice(3).flatMap(capitolo),
        { t: 'bottoni', h: 96, lista: [{ id: 'sez:bandiere:0', testo: 'Le tue bandiere' }, { id: 'sez:glossario:0', testo: 'Glossario' }] },
        { t: 'bottoni', h: 96, lista: [{ id: 'sez:quiz:0', testo: 'Quiz di capitolo' }, { id: 'sez:docente:0', testo: 'Note docente' }] },
      ],
    }],
  });

  let conferma = false;
  Motore.sezione('bandiere', {
    spreads: () => {
      const numeri = Array.from({ length: 20 }, (_, i) => i + 1);
      const quante = numeri.filter((n) => stato(n).bandiera).length;
      return [{
        sx: [
          { t: 'titolo', testo: 'Le tue bandiere' },
          { t: 'p', testo: 'Ogni lezione completata vale una bandiera del Codice internazionale dei segnali. Le venti bandiere formano la tua collezione.' },
          { t: 'nota', testo: `${quante} ${quante === 1 ? 'bandiera' : 'bandiere'} su 20` },
          { t: 'spazio', h: 40 },
          { t: 'bottoni', lista: [{ id: 'azzera', testo: conferma ? 'Conferma: cancella tutto' : 'Azzera i miei progressi' }] },
        ],
        dx: [{
          t: 'griglia', col: 4, h: 200,
          celle: numeri.map((n) => ({
            fn(c, x, y, w, h) {
              Libro.bandiera(c, n, x, y, w, h - 46, stato(n).bandiera);
              c.font = '34px Disegno, cursive'; c.fillStyle = C.ink2; c.textAlign = 'center';
              c.fillText(`lez. ${n}`, x + w / 2, y + h - 10); c.textAlign = 'left';
            },
          })),
        }],
        azione(id) {
          if (id !== 'azzera') return;
          if (conferma) { Libro.azzera(); location.reload(); } else conferma = true;
        },
      }];
    },
  });

  /* Glossario: voci ordinate e impaginate; in VR si sceglie la lettera, non si digita */
  const ordinati = [...GLOSSARIO].sort((a, b) => a[0].localeCompare(b[0], 'it'));
  const misura = document.createElement('canvas').getContext('2d');
  let pagineG = null; let lettere = null;
  function impaginaGlossario() {
    if (pagineG) return;
    pagineG = []; lettere = {};
    let pag = []; let y = 0;
    // A sinistra c'è il titolo; sulla prima pagina anche le lettere
    const massimo = () => (pagineG.length === 0 ? 880 : pagineG.length % 2 === 0 ? 1230 : 1340);
    ordinati.forEach((r) => {
      const testo = `**${r[0]}**  *${r[1]}*  {{lez. ${r[2]}}}`;
      const h = Pagina.quanteRighe(misura, testo, 38, Pagina.LARGA) * 50 + 22;
      if (y + h > massimo()) { pagineG.push(pag); pag = []; y = 0; }
      const l = r[0][0].toUpperCase();
      if (lettere[l] === undefined) lettere[l] = Math.floor(pagineG.length / 2);
      pag.push({ t: 'p', testo, size: 38 }); y += h;
    });
    if (pag.length) pagineG.push(pag);
  }

  Motore.sezione('glossario', {
    spreads: () => {
      impaginaGlossario();
      const iniziali = Object.keys(lettere);
      const salta = [];
      for (let i = 0; i < iniziali.length; i += 9) {
        salta.push({ t: 'bottoni', h: 74, size: 32, lista: iniziali.slice(i, i + 9).map((l) => ({ id: `sez:glossario:${lettere[l]}`, testo: l })) });
      }
      const out = [];
      for (let i = 0; i < pagineG.length; i += 2) {
        out.push({
          sx: [{ t: 'titolo', testo: 'Glossario italiano–inglese' }, ...(i === 0 ? salta : []), ...pagineG[i]],
          dx: pagineG[i + 1] || [],
        });
      }
      return out;
    },
  });
})();
