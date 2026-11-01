/* Copertina, indice, bandiere e glossario: tutto dentro il libro, anche in VR */
(function () {
  const { C } = Pagina;
  const { CAPITOLI, LEZIONI, PRONTE, stato } = Libro;

  function disegnaCopertina(c, W, H) {
    c.fillStyle = '#12355B'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#F6F3E8'; c.lineWidth = 4; c.strokeRect(50, 50, W - 100, H - 100);
    c.fillStyle = '#F6F3E8'; c.textAlign = 'center';
    c.font = '700 150px Bitter, Georgia, serif'; c.fillText('La nave', W / 2, 460);
    c.font = '64px Disegno, cursive'; c.fillText('quaderno di bordo', W / 2, 570);
    // Profilo a linee, come sul piano di costruzione
    c.save(); c.translate(120, 760); c.scale(1.85, 1.85);
    c.lineWidth = 3; c.lineJoin = 'round'; c.strokeStyle = '#F6F3E8'; c.beginPath();
    c.moveTo(20, 96); c.bezierCurveTo(60, 104, 130, 110, 260, 110); c.bezierCurveTo(390, 110, 460, 100, 505, 72);
    c.lineTo(482, 142); c.quadraticCurveTo(470, 152, 440, 152); c.lineTo(60, 152); c.quadraticCurveTo(40, 152, 32, 134); c.closePath();
    c.moveTo(34, 96); c.lineTo(34, 72); c.lineTo(112, 72); c.lineTo(112, 96);
    c.moveTo(46, 72); c.lineTo(46, 48); c.lineTo(98, 48); c.lineTo(98, 72);
    c.moveTo(62, 48); c.lineTo(62, 26); c.lineTo(82, 26); c.lineTo(82, 48);
    c.stroke();
    c.lineWidth = 1.4; c.strokeStyle = '#8FB2D6'; c.beginPath();
    [100, 150, 200, 250, 300, 350, 400, 445].forEach((x) => { c.moveTo(x, 108); c.lineTo(x, 152); });
    c.moveTo(0, 132); c.lineTo(520, 132); c.stroke();
    c.restore();
    c.font = '46px Disegno, cursive'; c.fillStyle = '#F6F3E8'; c.fillText('Prof. Daniele Palma Esposito', W / 2, 1320);
    c.font = '700 44px Atkinson, sans-serif'; c.fillText('Tocca per aprire', W / 2, 1460);
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
        { t: 'bottoni', h: 104, lista: [{ id: 'sez:bandiere:0', testo: 'Le tue bandiere' }, { id: 'sez:glossario:0', testo: 'Glossario' }] },
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
