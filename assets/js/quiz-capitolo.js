/* Quiz finale di capitolo: otto esercizi ripresi dalle lezioni, una sola risposta per domanda */
(function () {
  const { CAPITOLI, LEZIONI, stato, aggiorna } = Libro;

  // La lezione 13 ha esercizi propri: stessi dati, in forma di scelta o di calcolo
  const L13 = {
    a: { testo: 'Portacontainer di 180 m nel Mar Rosso, in agosto. Quale marca vale?', scelte: ['S', 'T', 'W'], giusta: 1, perche: 'Il Mar Rosso è in zona tropicale tutto l\'anno.' },
    b: { testo: 'Nave di 90 m nel Golfo del Leone, il 10 gennaio. Quale marca vale?', scelte: ['W', 'S', 'T'], giusta: 0, perche: 'Area invernale stagionale per navi fino a 100 m (16 dic – 15 mar).' },
    c: { testo: 'Distanza della TF dalla S, con TS = 8,64 m e FWA = 180 mm.', campi: [['TF sopra la S', 360, 0.5, 'mm']], soluzione: 'd = 180 mm; F a 180 mm (FWA): TF 360 mm sopra la S' },
  };
  // [lezione, esercizio]
  const SCELTI = {
    1: [[1, 3], [1, 4], [1, 6], [2, 2], [2, 4], [2, 5], [3, 2], [3, 4]],
    2: [[4, 1], [4, 3], [4, 4], [9, 2], [9, 3], [13, 'a'], [13, 'b'], [13, 'c']],
    3: [[5, 1], [5, 6], [6, 4], [7, 2], [7, 5], [8, 2], [8, 5], [12, 2]],
    4: [[10, 1], [10, 3], [10, 4], [10, 6], [11, 1], [11, 3], [11, 5], [11, 6]],
    5: [[14, 1], [14, 5], [14, 8], [15, 13], [15, 16], [16, 3], [16, 7], [17, 3]],
    6: [[18, 3], [18, 1], [18, 4], [19, 2], [19, 5], [19, 6], [20, 2], [20, 9]],
  };
  const chiave = (n) => `cap${n}`;
  const nomeSez = (n) => `quiz-${n}`;

  function mescola(lista) {
    const a = [...lista];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function nuovaProva(n) {
    return SCELTI[n].map(([l, q]) => {
      const es = l === 13 ? L13[q] : Lezione.esercizi[l].find((x) => x.n === q);
      return {
        l, es, esito: null, giusta: false, scelta: null, campo: 0,
        scelte: es.scelte ? mescola(es.scelte.map((testo, i) => ({ testo, ok: i === es.giusta }))) : null,
        valori: es.campi ? es.campi.map(() => '') : null,
      };
    });
  }
  const prove = {};
  const prova = (n) => prove[n] || (prove[n] = nuovaProva(n));

  function chiudi(n, v, giusta, testo) {
    v.giusta = giusta; v.esito = { tipo: giusta ? 'giusto' : 'errato', testo };
    const p = prova(n); const s = stato(chiave(n));
    aggiorna(chiave(n), {
      meglio: Math.max(s.meglio || 0, p.filter((x) => x.giusta).length),
      finito: s.finito || p.every((x) => x.esito),
    });
  }
  function rispondi(n, v, k) {
    if (v.esito) return;
    v.scelta = k;
    const giusta = v.scelte[k].ok; const sol = v.scelte.find((x) => x.ok).testo;
    chiudi(n, v, giusta, giusta ? `Esatto. ${v.es.perche}` : `Soluzione: ${sol}. ${v.es.perche}`);
  }
  function tasto(n, v, k) {
    if (v.esito) return;
    const c = v.campo;
    if (k === 'canc') { v.valori[c] = v.valori[c].slice(0, -1); return; }
    if (k !== 'ok') { if (v.valori[c].length < 9 && !(k === ',' && v.valori[c].includes(','))) v.valori[c] += k; return; }
    if (v.valori.some((x) => x === '')) return;
    const giusta = v.es.campi.every(([, val, tol], i) => Math.abs(Number(v.valori[i].replace(',', '.')) - val) <= (tol || 0.0001));
    chiudi(n, v, giusta, giusta ? `Esatto. ${v.es.soluzione}` : `Soluzione: ${v.es.soluzione}`);
  }

  function doppiaDomanda(n, cap, v, i, tot) {
    return {
      richiede: i === 0 ? undefined : () => !!prova(n)[i - 1].esito, avviso: 'Se salti, non conta.',
      sx: [
        { t: 'sotto', testo: `Quiz: ${cap.titolo}` },
        { t: 'nota', testo: `Domanda ${i + 1} di ${tot}, dalla lezione ${v.l}` },
        { t: 'p', testo: v.es.testo },
        ...(v.esito ? [{ t: 'esito', ...v.esito }] : []),
      ],
      dx: v.scelte
        ? [{ t: 'spazio', h: 120 }, ...v.scelte.map((x, k) => ({ t: 'scelta', id: `r:${k}`, testo: x.testo, on: v.scelta === k }))]
        : [
          ...v.es.campi.map(([nome, , , unita], k) => ({ t: 'bottoni', h: 96, size: 36, lista: [{ id: `campo:${k}`, testo: `${nome}: ${v.valori[k] || '…'} ${unita || ''}`.trim(), on: k === v.campo }] })),
          { t: 'spazio', h: 10 },
          { t: 'tastierino', virgola: true },
        ],
      azione(id) {
        if (id.startsWith('r:')) rispondi(n, v, Number(id.slice(2)));
        else if (id.startsWith('campo:')) v.campo = Number(id.slice(6));
        else if (id.startsWith('k:')) tasto(n, v, id.slice(2));
      },
    };
  }

  function doppiaEsito(n, p) {
    const giuste = p.filter((x) => x.giusta).length;
    const ripasso = [...new Set(p.filter((x) => !x.giusta).map((x) => x.l))];
    return {
      richiede: () => !!p[p.length - 1].esito, avviso: 'Se salti, non conta.',
      sx: [
        { t: 'titolo', testo: `${giuste} su ${p.length}` },
        ...(ripasso.length
          ? [{ t: 'p', size: 38, testo: 'Da ripassare:' }, ...ripasso.map((l) => ({ t: 'voce', n: l, id: `sez:${l}:0`, pronta: true, testo: LEZIONI[l] }))]
          : [{ t: 'p', testo: 'Tutte giuste.' }]),
      ],
      dx: [
        { t: 'spazio', h: 120 },
        { t: 'bottoni', lista: [{ id: 'ancora', testo: 'Riprova', on: true }] },
        { t: 'bottoni', lista: [{ id: 'sez:quiz:0', testo: 'Tutti i quiz' }] },
      ],
      azione(id) {
        if (id !== 'ancora') return;
        prove[n] = nuovaProva(n);
        // Il motore ridisegna dopo l'azione: si sfoglia subito dopo
        setTimeout(() => Motore.vai(nomeSez(n), 1), 0);
      },
    };
  }

  CAPITOLI.forEach((cap) => {
    const n = cap.n;
    Motore.sezione(nomeSez(n), {
      spreads() {
        const p = prova(n);
        return [
          {
            sx: [
              { t: 'titolo', testo: `Quiz: ${cap.titolo}` },
              { t: 'p', testo: `${p.length} esercizi presi dalle lezioni ${cap.lezioni.join(', ')}.` },
              { t: 'p', testo: 'Una sola risposta per domanda: subito dopo vedi la soluzione.' },
            ],
            dx: [
              { t: 'nota', testo: 'Il tuo risultato migliore' },
              { t: 'titolo', testo: stato(chiave(n)).finito ? `${stato(chiave(n)).meglio} su ${p.length}` : 'Ancora nessuno' },
            ],
          },
          ...p.map((v, i) => doppiaDomanda(n, cap, v, i, p.length)),
          doppiaEsito(n, p),
        ];
      },
    });
  });

  Motore.sezione('quiz', {
    spreads: () => [{
      sx: [
        { t: 'titolo', testo: 'Quiz di capitolo' },
        ...CAPITOLI.map((cap) => {
          const s = stato(chiave(cap.n));
          return { t: 'voce', n: cap.n, id: `sez:${nomeSez(cap.n)}:0`, pronta: true, fatta: !!s.finito, testo: s.finito ? `${cap.titolo}: ${s.meglio}/8` : cap.titolo };
        }),
      ],
      dx: [
        { t: 'sotto', testo: 'Come funziona' },
        { t: 'p', testo: 'Ogni quiz ripassa un capitolo intero con otto esercizi delle lezioni.' },
        { t: 'p', testo: 'Non serve aver guadagnato le bandiere. Puoi riprovare quante volte vuoi: resta il risultato migliore.' },
      ],
    }],
  });
})();
