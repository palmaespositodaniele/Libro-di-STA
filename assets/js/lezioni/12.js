/* Lezione 12: suddivisione interna. Disposizione dalla figura delle slide 2-10, dati SOLAS dalle
   slide 12, 13, 16. Le slide non dicono quanti compartimenti possono allagarsi: quanto affonda
   la nave nel modello è schematico */
(function () {
  const N = 12;
  const { COL, tratto, etichetta, pedana, compatta } = Tavola;
  const { fondo, insellatura, mezza, ascissa, fiancata, griglia, L } = Scafo;

  const MISSIONI = [
    { id: 'falla', testo: 'Con le paratie stagne, apri una falla in una stiva.' },
    { id: 'senza', testo: 'Togli le paratie stagne: dove va l\'acqua?' },
    { id: 'ponte', testo: 'Allaga finché il ponte arriva all\'acqua.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Le aree dedicate al carico sono…', scelte: ['Le stive', 'I gavoni', 'Le sentine'], giusta: 0, perche: 'Le stive (hold).' },
    { n: 2, testo: 'I gavoni servono soprattutto come…', scelte: ['Cisterne d\'assetto', 'Alloggi', 'Stive'], giusta: 0, perche: 'Depositi di liquidi per la posizione longitudinale voluta.' },
    { n: 3, testo: 'Larghezza massima di una porta stagna su nave passeggeri?', scelte: ['0,8 m', '1,2 m', '2,5 m'], giusta: 1, perche: 'Al massimo 1,2 m.' },
    { n: 4, testo: 'Tempo di chiusura di una porta stagna attivata a mano?', scelte: ['60 s', '90 s', '120 s'], giusta: 1, perche: '60 s meccanicamente, 90 s a mano.' },
    { n: 5, testo: 'Dove stanno le catene delle ancore?', scelte: ['Nella sentina', 'Nel pozzo delle catene', 'Nel tunnel'], giusta: 1, perche: 'Nel pozzo delle catene (chain locker).' },
    { n: 6, testo: 'La mastra è…', scelte: ['Il battente rialzato della boccaporta', 'Una porta stagna', 'Una cisterna'], giusta: 0, perche: 'Il battente rialzato (coaming) su cui scorrono i pannelli.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  // Da poppa a prua, come nella figura delle slide: u è la frazione di lunghezza
  const LOCALI = [
    { id: 'gp', nome: 'Gavone di poppa', u: [0, 0.1] },
    { id: 'sm', nome: 'Sala macchine', u: [0.1, 0.2] },
    { id: 's1', nome: 'Stiva 1', u: [0.2, 0.32] },
    { id: 's2', nome: 'Stiva 2', u: [0.32, 0.44] },
    { id: 's3', nome: 'Stiva 3', u: [0.44, 0.56] },
    { id: 's4', nome: 'Stiva 4', u: [0.56, 0.68] },
    { id: 's5', nome: 'Stiva 5', u: [0.68, 0.8] },
    { id: 'ci', nome: 'Cisterne', u: [0.8, 0.9] },
    { id: 'gv', nome: 'Gavone di prua', u: [0.9, 1] },
  ];
  const DF = 1.2; const MAX = 7;
  const s = { stagne: true, liv: LOCALI.map(() => 0), falla: LOCALI.map(() => false), aff: 0, trim: 0, sott: false, quanti: 0 };

  /* Acqua che riempie un locale fino a una quota: si rigenera mentre sale */
  function formaAcqua(geo, i, y) {
    const [u0, u1] = LOCALI[i].u; const p = geo.attributes.position; const nu = 12; const nv = 6; let n = 0;
    for (let a = 0; a <= nu; a++) for (let b = 0; b <= nv; b++) {
      const u = Math.min(0.992, Math.max(0.008, u0 + 0.004 + (a / nu) * (u1 - u0 - 0.008)));
      const base = Math.max(DF, fondo(u) + 0.1); const top = Math.max(base, Math.min(y, insellatura(u)));
      let q; let lato;
      if (b <= 2) { q = base + (b / 2) * (top - base); lato = 1; } else if (b <= 4) { q = top; lato = 1 - (b - 2); } else { q = top - ((b - 4) / 2) * (top - base); lato = -1; }
      p.setXYZ(n++, ascissa(u, q), q, lato * Math.max(0, mezza(u, q) - 0.05));
    }
    p.needsUpdate = true;
    geo.computeBoundingSphere();
  }

  const copie = [];
  function paratia(u) {
    return griglia(10, 10, (a, b) => {
      const k = fondo(u); const h = insellatura(u); const y = k + b * (h - k);
      return [ascissa(u, y), y, (2 * a - 1) * mezza(u, y)];
    });
  }
  function copia(k) {
    const nave = new THREE.Group(); const perno = new THREE.Group(); perno.position.set(L / 2, 0, 0);
    nave.position.set(-L / 2, -6, 0);
    perno.add(nave);
    const guscio = Scafo.vernice(); guscio.transparent = true; guscio.opacity = 0.34; guscio.depthWrite = false;
    [1, -1].forEach((sg) => nave.add(new THREE.Mesh(Scafo.dipinto(fiancata(0, 1, 0, 11, sg)), guscio)));
    const linee = new THREE.Group();
    [1, -1].forEach((sg) => { const q = []; for (let i = 0; i <= 60; i++) { const u = i / 60; const y = insellatura(u); q.push(new THREE.Vector3(ascissa(u, y), y + 0.05, sg * mezza(u, y))); } linee.add(tratto(q, 0.05 * k)); });
    const prof = []; for (let i = 0; i <= 60; i++) { const u = i / 60; prof.push(new THREE.Vector3(ascissa(u, fondo(u)), fondo(u), 0)); } for (let j = 1; j <= 8; j++) { const y = 3 + (j / 8) * (insellatura(1) - 3); prof.push(new THREE.Vector3(ascissa(1, y), y, 0)); }
    linee.add(tratto(prof, 0.06 * k));
    [1, -1].forEach((sg) => { const q = []; for (let i = 6; i <= 56; i++) { const u = i / 60; q.push(new THREE.Vector3(ascissa(u, DF), DF, sg * mezza(u, DF))); } linee.add(tratto(q, 0.03 * k, COL.medio)); });
    compatta(linee); nave.add(linee);
    // Doppio fondo
    const cielo = griglia(50, 2, (a, b) => { const u = 0.1 + a * 0.8; return [ascissa(u, DF), DF, (2 * b - 1) * mezza(u, DF)]; });
    nave.add(new THREE.Mesh(cielo, new THREE.MeshBasicMaterial({ color: COL.griglia, side: THREE.DoubleSide, transparent: true, opacity: 0.6, depthWrite: false })));
    // Paratie
    const matParatia = new THREE.MeshBasicMaterial({ color: COL.inchiostro, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false });
    const paratie = new THREE.Group();
    LOCALI.slice(1).forEach((l) => paratie.add(new THREE.Mesh(paratia(l.u[0]), matParatia)));
    nave.add(paratie);
    const acque = LOCALI.map((l, i) => {
      const geo = griglia(12, 6, () => [0, 0, 0]);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
      m.visible = false; m.frustumCulled = false;
      nave.add(m);
      return { m, geo, ultimo: -1, i };
    });
    // Ogni locale si tocca direttamente: bersagli invisibili, uno per compartimento
    const nascosto = new THREE.MeshBasicMaterial({ visible: false });
    LOCALI.forEach((l) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry((l.u[1] - l.u[0]) * L, 9, Scafo.B), nascosto);
      m.position.set(((l.u[0] + l.u[1]) / 2) * L, 4.5, 0);
      m.userData.tocco = `l:${l.id}`;
      nave.add(m); prese[k > 1 ? 'mini' : 'schermo'].push(m);
    });
    copie.push({ nave, perno, acque, matParatia });
    return perno;
  }
  const prese = { schermo: [], mini: [] };

  const VISTA = () => ({ target: new THREE.Vector3(45, 1, 0), theta: 0.12, phi: 1.38, r: 118 });
  let mondo = null;
  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    radice.add(copia(1), Scafo.mare());
    [['prua', 82, 12, 0], ['poppa', 8, 12, 0]].forEach(([t, x, y, z]) => { const e = etichetta(t, 5); e.position.set(x, y, z); radice.add(e); });
    const stazioni = [
      { pedana: pedana(45, 22, 'a dritta'), pos: new THREE.Vector3(45, 0.25, 22), yaw: 0 },
      { pedana: (() => { const p = pedana(45, 0, 'dentro la stiva 3'); p.scale.setScalar(0.3); p.position.y = -4.86; return p; })(), pos: new THREE.Vector3(45, -4.8, 0), yaw: -Math.PI / 2 },
      { pedana: (() => { const p = pedana(66, 0, 'dentro la stiva 5'); p.scale.setScalar(0.3); p.position.y = -4.86; return p; })(), pos: new THREE.Vector3(66, -4.8, 0), yaw: Math.PI / 2 },
    ];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const SC = 0.012; const mini = new THREE.Group();
    mini.add(copia(6), Scafo.vasca()); mini.scale.setScalar(SC); mini.position.set(-45 * SC, 0.03, 0);
    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      tocchi: (v) => prese[v === 'mini' ? 'mini' : 'schermo'],
      frame(dt) {
        let mosso = false;
        LOCALI.forEach((l, i) => {
          const arriva = s.falla[i] || (!s.stagne && ((i > 0 && s.liv[i - 1] > 0.5) || (i < LOCALI.length - 1 && s.liv[i + 1] > 0.5)));
          if (arriva && s.liv[i] < 1) { s.liv[i] = Math.min(1, s.liv[i] + dt * 0.1); mosso = true; }
        });
        // Quanto affonda la nave: valore solo schematico
        const pieni = s.liv.reduce((a, v) => a + v, 0);
        const m = LOCALI.reduce((a, l, i) => a + s.liv[i] * ((l.u[0] + l.u[1]) / 2 - 0.5), 0);
        const aff = Math.min(1.25, pieni * 0.5); const tr = m * 0.026;
        s.aff = aff; s.trim = tr;
        const quanti = s.liv.filter((v) => v > 0.02).length;
        // A grandezza vera il pavimento non si muove sotto i piedi: sale solo l'acqua
        const fermo = Motore.presente() && Motore.scalaVera();
        copie.forEach((c, ic) => {
          const f = fermo && ic === 0;
          c.perno.position.y = f ? 0 : -aff; c.perno.rotation.z = f ? 0 : -tr;
          c.acque.forEach((q) => {
            const v = s.liv[q.i]; q.m.visible = v > 0.01;
            const y = DF + v * (MAX - DF);
            if (q.m.visible && Math.abs(q.ultimo - y) > 0.01) { formaAcqua(q.geo, q.i, y); q.ultimo = y; }
          });
          c.matParatia.color.setHex(s.stagne ? COL.inchiostro : COL.ocra);
          c.matParatia.opacity = s.stagne ? 0.55 : 0.28;
        });
        if (aff >= 1.2 && !s.sott) { s.sott = true; lez.completa('ponte'); Motore.ridisegna(); }
        if (quanti !== s.quanti) { s.quanti = quanti; Motore.ridisegna(); }
        return mosso;
      },
    };
    return mondo;
  }

  function comandi(idTocco) {
    const id = idTocco.startsWith('t:') ? idTocco.slice(2).split(',')[0] : idTocco;
    if (id.startsWith('l:')) {
      const i = LOCALI.findIndex((l) => l.id === id.slice(2));
      s.falla[i] = true;
      if (s.stagne && i >= 2 && i <= 6) lez.completa('falla');
      if (!s.stagne) lez.completa('senza');
    }
    if (id === 'stagne') { s.stagne = !s.stagne; if (!s.stagne && s.falla.some((f) => f)) lez.completa('senza'); }
    if (id === 'ripara') { s.liv = LOCALI.map(() => 0); s.falla = LOCALI.map(() => false); s.sott = false; }
    Motore.sporco();
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { pa: 'Sì, se le paratie fermano l\'acqua', no: 'No, una falla la affonda', si: 'Sì, anche senza paratie' };
    const allagati = s.liv.filter((v) => v > 0.02).length;
    const stato = s.sott ? 'Il ponte è arrivato all\'acqua: la nave affonda.' : s.falla.some((f) => f) ? `Locali con acqua: ${allagati}.` : 'Nessuna falla: scegli un locale.';
    const bot = (a, b) => ({ t: 'bottoni', h: 84, size: 32, lista: LOCALI.slice(a, b).map((l) => ({ id: `l:${l.id}`, testo: l.nome, on: s.falla[LOCALI.indexOf(l)] })) });
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Dentro la nave' },
          { t: 'p', testo: 'Lo spazio interno è suddiviso in locali con diverse destinazioni d\'uso. {{slide 2}}' },
          { t: 'p', testo: 'Le **stive** (*hold*) sono le aree dedicate al carico, separate da **paratie** (*bulkhead*) trasversali e in qualche caso longitudinali. {{slide 3}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'Le paratie sono strutture verticali che dividono lo scafo in compartimenti, garantendo robustezza e sicurezza. {{slide 4}}' },
          { t: 'p', testo: 'La **sala macchine** (*engine room*) è lo spazio più ampio dopo le stive. {{slide 3}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Una falla apre lo scafo all\'altezza di una stiva: l\'acqua di mare entra.' },
        ],
        dx: [
          { t: 'sotto', testo: 'La nave galleggia ancora?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:pa', testo: 'Sì, se le paratie stagne fermano l\'acqua', on: p === 'pa' },
          { t: 'scelta', id: 'p:no', testo: 'No, una sola falla la affonda', on: p === 'no' },
          { t: 'scelta', id: 'p:si', testo: 'Sì, anche senza paratie stagne', on: p === 'si' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Apri una falla' },
          bot(0, 3), bot(3, 6), bot(6, 9),
          { t: 'bottoni', h: 84, size: 32, lista: [{ id: 'stagne', testo: s.stagne ? 'Paratie stagne: sì' : 'Paratie stagne: no', on: s.stagne }, { id: 'ripara', testo: 'Ripara tutto' }] },
          { t: 'riquadro', size: 36, testo: stato },
          ...lez.missioni(),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 760,
            testo: !vr ? '' : vera
              ? 'Punta una pedana e premi il grilletto: entra nelle stive. Qui la nave resta ferma e sale solo l\'acqua.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'nota', testo: 'Tocca un locale sulla nave per aprire la falla. Quanto affonda è schematico: le slide non danno un numero di compartimenti.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'pa' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Con le paratie stagne l\'acqua resta nel locale colpito. Senza, passa da un locale all\'altro.' },
          { t: 'nota', testo: 'Quanti locali la nave sopporta dipende dalla nave: le slide non danno un numero' },
        ],
        dx: [
          { t: 'titolo', testo: 'Le paratie stagne' },
          { t: 'p', testo: 'Le paratie stagne (impermeabili) sono cruciali per impedire la propagazione di acqua; quelle non stagne possono essere divisionali. {{slide 4}}' },
          { t: 'p', testo: 'La separazione di una stiva da quella contigua avviene mediante una paratia trasversale stagna. {{slide 4}}' },
          { t: 'p', testo: 'Le trasversali dividono da dritta a sinistra, le longitudinali da prua a poppa. {{slide 4}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'I locali' },
          { t: 'tabella', col: [40, 60], size: 32, righe: [
            ['Locale', 'A che cosa serve'],
            ['Doppio fondo (*double bottom*)', 'zavorra, bunker, riserve liquide'],
            ['Gavoni (*peak*)', 'cisterne d\'assetto'],
            ['Cala del nostromo (*bosun\'s locker*)', 'accessori e parti di rispetto'],
            ['Cisterne (*ballast, fuel, fresh water tank*)', 'zavorra, combustibile, acqua dolce'],
          ] },
          { t: 'nota', testo: 'slide 5, 6' },
        ],
        dx: [
          { t: 'tabella', col: [40, 60], size: 32, righe: [
            ['Locale', 'A che cosa serve'],
            ['Agghiaccio del timone (*steering gear compartment*)', 'sistema che ruota l\'asse del timone'],
            ['Pozzo delle catene (*chain locker*)', 'catene delle ancore, a prua della paratia di collisione'],
            ['Tunnel dell\'asse (*shaft tunnel*)', 'condotto stagno e ispezionabile'],
            ['Intercapedini (*cofferdam*)', 'spazi tra due paratie, per sicurezza'],
            ['Sentine (*bilge*)', 'raccolgono acque sporche e morchie'],
          ] },
          { t: 'nota', testo: 'slide 7–10' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Le porte stagne' },
          { t: 'p', size: 38, testo: 'Per attraversare le paratie stagne servono porte stagne (*watertight door*), limitate al minimo indispensabile. {{slide 11}}' },
          { t: 'tabella', col: [58, 42], size: 32, righe: [
            ['Navi passeggeri', 'SOLAS'],
            ['Larghezza massima', '1,2 m'],
            ['Inclinazione trasversale', 'fino a 15°'],
            ['Chiusura meccanica', '60 s'],
            ['Chiusura a mano', '90 s'],
            ['Moto effettivo', 'tra 20 s e 40 s'],
            ['Allarme prima del moto', 'tra 5 s e 10 s'],
          ] },
          { t: 'nota', testo: 'slide 12, 13' },
        ],
        dx: [
          { t: 'titolo', testo: 'Altre aperture' },
          { t: 'p', size: 36, testo: '**Boccaporte** (*hatch*): battente rialzato o mastra (*coaming*), pannelli di chiusura (*hatch cover*), guarnizioni di gomma. {{slide 14}}' },
          { t: 'p', size: 36, testo: '**Portelloni** (*bow/stern door*) e **rampe** (*ramp*) sulle RO-RO; **celata** (*bow visor*) se si solleva un\'intera zona della prua. {{slide 15, 17}}' },
          { t: 'p', size: 36, testo: 'Oblò, passi d\'uomo, boccaportelli, maniche a vento, sfoghi d\'acqua, ombrinali, cofani (*trunks*). {{slide 18–20}}' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni delle slide. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      lez.premio(() => lez.fatto.quiz(QUIZ.map((q) => q.n))),
    ];
  });
})();
