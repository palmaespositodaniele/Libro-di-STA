/* Dati del libro e progressi dello studente. Regole in design.md */
(function () {
  const CAPITOLI = [
    { n: 1, titolo: 'La nave', lezioni: [1, 2, 3] },
    { n: 2, titolo: 'Forma e misure dello scafo', lezioni: [4, 9, 13] },
    { n: 3, titolo: 'Costruzione e struttura', lezioni: [5, 6, 7, 8, 12] },
    { n: 4, titolo: 'Propulsione e governo', lezioni: [10, 11] },
    { n: 5, titolo: 'Navigazione', lezioni: [14, 15, 16, 17] },
    { n: 6, titolo: 'Meteo, norme e porti', lezioni: [18, 19, 20] },
  ];
  const LEZIONI = {
    1: 'Generalità sul mezzo nave', 2: 'Categorie di navi', 3: 'Tipi di navi',
    4: 'Geometria della nave', 5: 'Scafo in legno', 6: 'Fasi di costruzione della nave',
    7: 'Materiali usati per la costruzione navale', 8: 'Elementi strutturali dello scafo',
    9: 'Dimensioni geometriche dello scafo', 10: 'Propulsori e timoni', 11: 'Propulsori e timoni, parte 2',
    12: 'Suddivisione interna', 13: 'Il bordo libero', 14: 'Unità di misura: miglio nautico e nodi',
    15: 'Calcoli di navigazione', 16: 'Forma della Terra, coordinate e orientamento',
    17: 'Strumentazione di bordo', 18: 'Nozioni di meteorologia', 19: 'La legislazione marittima', 20: 'Logistica e porti',
  };

  // Le bandiere si disegnano quando la lezione viene creata (design.md, «Bandiere»)
  const BANDIERE = {
    1: {
      nome: 'Alfa',
      significato: 'Ho un palombaro in immersione: tenetevi lontani e a bassa velocità.',
      disegna(c, x, y, w, h) {
        c.save(); c.beginPath();
        c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w * 0.76, y + h / 2); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath();
        c.clip();
        c.fillStyle = '#fff'; c.fillRect(x, y, w / 2, h);
        c.fillStyle = '#1B4FA0'; c.fillRect(x + w / 2, y, w / 2, h);
        c.restore();
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.beginPath();
        c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w * 0.76, y + h / 2); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.stroke();
      },
    },
    4: {
      nome: 'Delta',
      significato: 'Tenetevi lontani da me: sto manovrando con difficoltà.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#F2C230'; c.fillRect(x, y, w, h);
        c.fillStyle = '#1B4FA0'; c.fillRect(x, y + h / 4, w, h / 2);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    9: {
      nome: 'India',
      significato: 'Sto accostando a sinistra.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#F2C230'; c.fillRect(x, y, w, h);
        c.fillStyle = '#111'; c.beginPath(); c.arc(x + w / 2, y + h / 2, h * 0.32, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    10: {
      nome: 'Juliett',
      significato: 'Ho un incendio a bordo e merci pericolose: tenetevi lontani.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#1B4FA0'; c.fillRect(x, y, w, h);
        c.fillStyle = '#fff'; c.fillRect(x, y + h / 3, w, h / 3);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    11: {
      nome: 'Kilo',
      significato: 'Desidero comunicare con voi.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#F2C230'; c.fillRect(x, y, w / 2, h);
        c.fillStyle = '#1B4FA0'; c.fillRect(x + w / 2, y, w / 2, h);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    17: {
      nome: 'Quebec',
      significato: 'La mia nave è indenne e chiedo la libera pratica.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#F2C230'; c.fillRect(x, y, w, h);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    18: {
      nome: 'Romeo',
      significato: 'Nel Codice di oggi, da sola, non ha un significato proprio.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#C8202A'; c.fillRect(x, y, w, h);
        c.fillStyle = '#F2C230'; c.fillRect(x, y + h * 0.42, w, h * 0.16); c.fillRect(x + w / 2 - h * 0.08, y, h * 0.16, h);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    5: {
      nome: 'Echo',
      significato: 'Sto accostando a dritta.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#1B4FA0'; c.fillRect(x, y, w, h / 2);
        c.fillStyle = '#C8202A'; c.fillRect(x, y + h / 2, w, h / 2);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    6: {
      nome: 'Foxtrot',
      significato: 'Sono in avaria: comunicate con me.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#fff'; c.fillRect(x, y, w, h);
        c.fillStyle = '#C8202A'; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w, y + h / 2); c.lineTo(x + w / 2, y + h); c.lineTo(x, y + h / 2); c.closePath(); c.fill();
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    7: {
      nome: 'Golf',
      significato: 'Ho bisogno di un pilota.',
      disegna(c, x, y, w, h) {
        for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#1B4FA0' : '#F2C230'; c.fillRect(x + (i * w) / 6, y, w / 6 + 0.5, h); }
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    8: {
      nome: 'Hotel',
      significato: 'Ho il pilota a bordo.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#fff'; c.fillRect(x, y, w / 2, h);
        c.fillStyle = '#C8202A'; c.fillRect(x + w / 2, y, w / 2, h);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    12: {
      nome: 'Lima',
      significato: 'Fermate immediatamente la vostra nave.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#F2C230'; c.fillRect(x, y, w, h);
        c.fillStyle = '#111'; c.fillRect(x + w / 2, y, w / 2, h / 2); c.fillRect(x, y + h / 2, w / 2, h / 2);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    14: {
      nome: 'November',
      significato: 'No.',
      disegna(c, x, y, w, h) {
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#fff' : '#1B4FA0'; c.fillRect(x + (i * w) / 4, y + (j * h) / 4, w / 4 + 0.5, h / 4 + 0.5); }
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    15: {
      nome: 'Oscar',
      significato: 'Uomo in mare.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#F2C230'; c.fillRect(x, y, w, h);
        c.fillStyle = '#C8202A'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.lineTo(x + w, y); c.closePath(); c.fill();
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    16: {
      nome: 'Papa',
      significato: 'Tutto il personale rientri a bordo: la nave sta per partire.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#1B4FA0'; c.fillRect(x, y, w, h);
        c.fillStyle = '#fff'; c.fillRect(x + w / 3, y + h / 3, w / 3, h / 3);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    20: {
      nome: 'Tango',
      significato: 'Tenetevi lontani da me: sto eseguendo una pesca a strascico a coppia.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#C8202A'; c.fillRect(x, y, w / 3, h);
        c.fillStyle = '#fff'; c.fillRect(x + w / 3, y, w / 3, h);
        c.fillStyle = '#1B4FA0'; c.fillRect(x + (2 * w) / 3, y, w / 3 + 0.5, h);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    2: {
      nome: 'Bravo',
      significato: 'Sto caricando, scaricando o trasportando merci pericolose.',
      disegna(c, x, y, w, h) {
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w * 0.76, y + h / 2); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath();
        c.fillStyle = '#C8202A'; c.fill();
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.stroke();
      },
    },
    3: {
      nome: 'Charlie',
      significato: 'Sì.',
      disegna(c, x, y, w, h) {
        ['#1B4FA0', '#fff', '#C8202A', '#fff', '#1B4FA0'].forEach((col, i) => { c.fillStyle = col; c.fillRect(x, y + (i * h) / 5, w, h / 5 + 0.5); });
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    19: {
      nome: 'Sierra',
      significato: 'Le mie macchine vanno indietro.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#fff'; c.fillRect(x, y, w, h);
        c.fillStyle = '#1B4FA0'; c.fillRect(x + w / 3, y + h / 3, w / 3, h / 3);
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
    13: {
      nome: 'Mike',
      significato: 'La mia nave è ferma e non ha abbrivio.',
      disegna(c, x, y, w, h) {
        c.fillStyle = '#1B4FA0'; c.fillRect(x, y, w, h);
        c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
        c.strokeStyle = '#fff'; c.lineWidth = h * 0.2; c.beginPath();
        c.moveTo(x, y); c.lineTo(x + w, y + h); c.moveTo(x + w, y); c.lineTo(x, y + h); c.stroke();
        c.restore();
        c.strokeStyle = '#0B2545'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      },
    },
  };

  const CHIAVE = 'libroNave.v2';
  let memoria = { lezioni: {} };
  try {
    const salvato = localStorage.getItem(CHIAVE);
    if (salvato) memoria = JSON.parse(salvato);
  } catch (e) { /* il browser non salva: si resta in memoria */ }

  function salva() {
    try { localStorage.setItem(CHIAVE, JSON.stringify(memoria)); } catch (e) { /* vedi sopra */ }
  }
  function stato(n) { return memoria.lezioni[n] || (memoria.lezioni[n] = {}); }
  function aggiorna(n, modifica) { Object.assign(stato(n), modifica); salva(); }
  function azzera() { memoria = { lezioni: {} }; salva(); }
  function letteraDi(n) { return String.fromCharCode(64 + n); }

  function bandiera(c, n, x, y, w, h, guadagnata) {
    const b = BANDIERE[n];
    if (guadagnata && b) { b.disegna(c, x, y, w, h); return; }
    c.setLineDash([12, 9]); c.strokeStyle = '#5B6B7C'; c.lineWidth = 3; c.strokeRect(x, y, w, h); c.setLineDash([]);
    c.font = `${Math.round(h * 0.5)}px Disegno, cursive`; c.fillStyle = '#5B6B7C'; c.textAlign = 'center';
    c.fillText(letteraDi(n), x + w / 2, y + h * 0.68); c.textAlign = 'left';
  }

  /* Passi della lezione: rail in testa alla pagina sinistra */
  const PASSI = ['Concetto', 'Prevedi', 'Prova', 'Scopri', 'Bandiera'];
  function rail(n, spreads, attuale) {
    const primi = {};
    spreads.forEach((s, i) => { if (primi[s.passo] === undefined) primi[s.passo] = i; });
    return {
      t: 'rail',
      lista: PASSI.map((nome, k) => ({ id: `sez:${n}:${primi[k]}`, testo: nome, on: k === attuale })),
    };
  }

  window.Libro = { CAPITOLI, LEZIONI, BANDIERE, PRONTE: [], stato, aggiorna, azzera, letteraDi, bandiera, rail };
})();
