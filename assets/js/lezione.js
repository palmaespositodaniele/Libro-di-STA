/* Base comune delle lezioni: missioni, quiz, bandiera, tasto Salta. Regole in design.md */
window.Lezione = (function () {
  // Gli esercizi di ogni lezione, ripresi dai quiz di capitolo
  const esercizi = {};
  /* cfg: { n, missioni: [{id,testo}], quiz: [{n,testo,scelte,giusta,perche}],
           calcoli: [{n,testo,campi:[[nome,valore,tolleranza,unità]],soluzione}] } */
  function crea(cfg) {
    const { n } = cfg;
    Libro.PRONTE.push(n);
    esercizi[n] = [...(cfg.quiz || []), ...(cfg.calcoli || [])];
    const salvate = Libro.stato(n);
    const fatte = new Set(salvate.missioni || []);
    const risolti = new Set(salvate.esercizi || []);
    const tentativi = {}; const esiti = {};
    const quiz = cfg.quiz || [];
    const calcoli = cfg.calcoli || [];
    // Con molti esercizi ogni gruppo (g) ha la sua pagina e la sua scheda
    const valori = {}; const schede = {};
    const delGruppo = (g) => (g ? calcoli.filter((x) => x.g === g) : calcoli);
    const schedaDi = (g) => schede[g || 0] || (schede[g || 0] = { n: delGruppo(g).length ? delGruppo(g)[0].n : 0, campo: 0 });
    quiz.forEach((q) => { if (risolti.has(q.n)) esiti[q.n] = { tipo: 'giusto', testo: q.perche }; });
    calcoli.forEach((q) => { if (risolti.has(q.n)) esiti[q.n] = { tipo: 'giusto', testo: q.soluzione }; });

    function completa(id) {
      if (fatte.has(id)) return;
      fatte.add(id);
      Libro.aggiorna(n, { missioni: [...fatte] });
    }
    function risolto(q) {
      risolti.add(q);
      Libro.aggiorna(n, { esercizi: [...risolti] });
    }
    // La bandiera si guadagna solo facendo tutti i passaggi
    function daFare() {
      const st = Libro.stato(n); const lista = [];
      const es = quiz.length + calcoli.length - risolti.size;
      if (!st.prevedi) lista.push('la previsione');
      if (fatte.size < cfg.missioni.length) lista.push(`le missioni (${fatte.size} su ${cfg.missioni.length})`);
      if (!st.aletta) lista.push('l\'aletta dello Scopri');
      if (es > 0) lista.push(es === 1 ? '1 esercizio' : `${es} esercizi`);
      return lista;
    }
    function rispondi(qn, i) {
      const q = quiz.find((x) => x.n === qn);
      if (i === q.giusta) { esiti[qn] = { tipo: 'giusto', testo: q.perche }; risolto(qn); return; }
      tentativi[qn] = (tentativi[qn] || 0) + 1;
      if (tentativi[qn] >= 2) { esiti[qn] = { tipo: 'errato', testo: `Soluzione: ${q.scelte[q.giusta]}. ${q.perche}` }; risolto(qn); } else esiti[qn] = { tipo: 'errato', testo: 'Non è questa: riprova.' };
    }

    // Esercizi con risultato numerico, svolti con il tastierino della pagina
    function tasto(k, g) {
      const scheda = schedaDi(g);
      const q = calcoli.find((x) => x.n === scheda.n);
      if (risolti.has(q.n)) return;
      const v = valori[q.n] || (valori[q.n] = q.campi.map(() => ''));
      if (k === 'canc') { v[scheda.campo] = v[scheda.campo].slice(0, -1); return; }
      if (k !== 'ok') { if (v[scheda.campo].length < 9 && !(k === ',' && v[scheda.campo].includes(','))) v[scheda.campo] += k; return; }
      const giusto = q.campi.every(([, val, tol], i) => v[i] !== '' && Math.abs(Number(v[i].replace(',', '.')) - val) <= (tol || 0.0001));
      if (giusto) { esiti[q.n] = { tipo: 'giusto', testo: q.soluzione }; risolto(q.n); return; }
      tentativi[q.n] = (tentativi[q.n] || 0) + 1;
      if (tentativi[q.n] >= 2) { esiti[q.n] = { tipo: 'errato', testo: `Soluzione: ${q.soluzione}` }; risolto(q.n); } else esiti[q.n] = { tipo: 'errato', testo: 'Non torna: ricontrolla il calcolo.' };
    }
    function calcoloSx(g) {
      const scheda = schedaDi(g); const lista = delGruppo(g);
      const q = calcoli.find((x) => x.n === scheda.n);
      return [
        { t: 'bottoni', h: 96, size: 38, lista: lista.map((x) => ({ id: `calc:${x.n}`, testo: String(x.n), on: x.n === scheda.n })) },
        { t: 'p', testo: q.testo },
        ...(esiti[q.n] ? [{ t: 'esito', ...esiti[q.n] }] : []),
        { t: 'nota', testo: `Svolti: ${lista.filter((x) => risolti.has(x.n)).length} su ${lista.length}` },
      ];
    }
    function calcoloDx(g) {
      const scheda = schedaDi(g);
      const q = calcoli.find((x) => x.n === scheda.n);
      const v = valori[q.n] || q.campi.map(() => '');
      return [
        ...q.campi.map(([nome, , , unita], i) => ({ t: 'bottoni', h: 96, size: 36, lista: [{ id: `campo:${i}`, testo: `${nome}: ${v[i] || '…'} ${unita || ''}`.trim(), on: i === scheda.campo }] })),
        { t: 'spazio', h: 10 },
        { t: 'tastierino', virgola: true },
      ];
    }

    const missioni = () => cfg.missioni.map((m) => ({ t: 'spunta', testo: m.testo, fatta: fatte.has(m.id) }));
    const domanda = (qn) => {
      const q = quiz.find((x) => x.n === qn);
      return [
        { t: 'p', size: 38, testo: `**${q.n}.** ${q.testo}` },
        { t: 'bottoni', h: 84, size: 32, lista: q.scelte.map((s, i) => ({ id: `q:${q.n}:${i}`, testo: s, off: risolti.has(q.n) })) },
        ...(esiti[q.n] ? [{ t: 'esito', ...esiti[q.n] }] : []),
      ];
    };
    function premio(richiede) {
      const b = Libro.BANDIERE[n]; const mancano = daFare(); const ok = mancano.length === 0;
      const lettera = Libro.letteraDi(n);
      return {
        passo: 4, richiede, avviso: 'Se salti, niente bandiera.',
        sx: ok ? [
          { t: 'titolo', testo: `Bandiera ${lettera} guadagnata` },
          { t: 'p', testo: `${b.nome}: «${b.significato}»` },
          { t: 'nota', testo: 'Bandiera del Codice internazionale dei segnali' },
          { t: 'bottoni', lista: [{ id: 'sez:bandiere:0', testo: 'Le tue bandiere' }] },
        ] : [
          { t: 'titolo', testo: `Bandiera ${lettera} non ancora guadagnata` },
          { t: 'p', testo: `Hai saltato qualche passaggio. Per guadagnarla manca: ${mancano.join(', ')}.` },
          { t: 'bottoni', lista: [{ id: `sez:${n}:0`, testo: 'Torna all\'inizio della lezione' }] },
        ],
        dx: [{ t: 'spazio', h: 200 }, { t: 'disegno', h: 720, fn: (c, x, y, w) => Libro.bandiera(c, n, x + w * 0.1, y, w * 0.8, w * 0.53, ok) }],
      };
    }

    function registra(doppie) {
      Motore.sezione(String(n), {
        spreads() {
          const lista = doppie();
          return lista.map((sp) => ({
            ...sp,
            sx: [Libro.rail(n, lista, sp.passo), ...sp.sx],
            azione(id) {
              if (id.startsWith('p:')) Libro.aggiorna(n, { prevedi: id.slice(2) });
              else if (id === 'aletta') Libro.aggiorna(n, { aletta: true });
              else if (id.startsWith('q:')) { const [, q, i] = id.split(':'); rispondi(Number(q), Number(i)); } else if (id.startsWith('calc:')) { const sc = schedaDi(sp.gruppo); sc.n = Number(id.slice(5)); sc.campo = 0; } else if (id.startsWith('campo:')) schedaDi(sp.gruppo).campo = Number(id.slice(6));
              else if (id.startsWith('k:')) { if (calcoli.length) tasto(id.slice(2), sp.gruppo); } else if (sp.azione) sp.azione(id);
              if (daFare().length === 0) Libro.aggiorna(n, { bandiera: true });
            },
          }));
        },
      });
    }

    return {
      fatte, risolti, completa, missioni, domanda, calcoloSx, calcoloDx, premio, registra,
      fatto: { prevedi: () => !!Libro.stato(n).prevedi, missioni: () => fatte.size === cfg.missioni.length, aletta: () => !!Libro.stato(n).aletta, quiz: (lista) => lista.every((q) => risolti.has(q)) },
    };
  }

  /* Una simulazione in più, con meno codice: cfg.modello(k, tocca) costruisce una copia (k grande = modellino)
     e chiama tocca(oggetto) per ogni cosa toccabile o trascinabile.
     cfg: { modello, vista, scala, centro: [x, y], pedana: [x, z, nome], mare, trascina, frame, sopra, dopo } */
  function simula(cfg) {
    let m = null;
    return () => {
      if (m) return m;
      const prese = { schermo: [], mini: [] };
      const radice = new THREE.Group();
      radice.add(cfg.modello(1, (o) => prese.schermo.push(o)));
      if (cfg.mare !== false) radice.add(Scafo.mare());
      const [px, pz, nome] = cfg.pedana || [45, 26, 'a dritta'];
      const p = Tavola.pedana(px, pz, nome); p.visible = false;
      const SC = cfg.scala || 0.012; const [cx, cy] = cfg.centro || [45, 0];
      const mini = new THREE.Group();
      mini.add(cfg.modello(cfg.k || 5, (o) => prese.mini.push(o)));
      if (cfg.mare !== false) mini.add(Scafo.vasca());
      mini.scale.setScalar(SC); mini.position.set(-cx * SC, -cy * SC, 0);
      if (cfg.dopo) cfg.dopo();
      m = {
        radice, modellino: mini, stazioni: [{ pedana: p, pos: new THREE.Vector3(px, 0.25, pz), yaw: 0 }],
        vistaIniziale: cfg.vista, tocchi: (v) => (v === 'mini' ? prese.mini : prese.schermo),
        trascina: cfg.trascina, sopra: cfg.sopra, frame: cfg.frame || (() => false),
      };
      return m;
    };
  }
  // Pezzi di pagina comuni alle simulazioni
  function finestra(h, testoVR) {
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    return [
      { t: 'zona', id: 'finestra', h, testo: !vr ? '' : vera ? 'Levetta sinistra: cammini verso dove guardi. Levetta destra: di lato giri, avanti e indietro sali e scendi. Oppure punta una pedana e premi il grilletto. Premi la levetta per tornare alla pedana.' : `${testoVR || 'Punta la sfera d\'oro, tieni premuto il grilletto e muovi la mano.'} Per spostare il modellino stringi il tasto laterale; con la levetta lo allontani e lo giri.` },
      ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
    ];
  }

  /* Cursori della pagina. cursore(id, nome, valore, x, min, max, da, a) dà il blocco;
     letto(azione, id, min, max, passo) dà il valore scelto (arrotondato al passo), 'fine' al rilascio, null se non è suo */
  function cursore(id, nome, valore, x, min, max, da, a) {
    return { t: 'cursore', id, nome, valore, f: (x - min) / (max - min), da, a };
  }
  function letto(azione, id, min, max, passo) {
    if (!azione.startsWith(`sl:${id}:`)) return null;
    const r = azione.slice(id.length + 4);
    if (r === 'fine') return 'fine';
    const v = min + Number(r) * (max - min);
    return passo ? Math.round(v / passo) * passo : v;
  }

  return { crea, simula, finestra, esercizi, cursore, letto };
})();
