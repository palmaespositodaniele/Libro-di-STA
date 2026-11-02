/* Lezione 8: elementi strutturali dello scafo. Sistemi strutturali dalle tabelle nelle immagini
   delle slide 6, 7, 8. Il tratto di scafo disegnato è schematico */
(function () {
  const N = 8;
  const { COL, segmento, etichetta, pedana, compatta, maniglia } = Tavola;

  const MISSIONI = [
    { id: 'tre', testo: 'Guarda tutti e tre i sistemi strutturali.' },
    { id: 'esploso', testo: 'Apri lo scafo in esploso.' },
    { id: 'mista', testo: 'Struttura mista: guarda il fianco.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Sotto quale lunghezza si usa di norma la struttura trasversale?', scelte: ['65 m', '100 m', '200 m'], giusta: 0, perche: 'Generalmente per navi di piccola dimensione, normalmente sotto i 65 m.' },
    { n: 2, testo: 'Nella struttura mista il fianco è di tipo…', scelte: ['Trasversale', 'Longitudinale', 'Senza rinforzi'], giusta: 0, perche: 'Fondo e ponte sono longitudinali, il fianco è trasversale.' },
    { n: 3, testo: 'La struttura mista è tipica delle…', scelte: ['Grandi rinfusiere solide', 'Navi di piccola dimensione', 'Navi in legno'], giusta: 0, perche: 'Tipicamente per le grandi rinfusiere solide (bulk carrier).' },
    { n: 4, testo: 'Il paramezzale centrale è…', scelte: ['Continuo da poppa a prua', 'Interrotto dalle costole', 'Sul ponte'], giusta: 0, perche: 'È continuo; quelli laterali sono intercostali, interrotti.' },
    { n: 5, testo: 'I madieri sono le ossature trasversali…', scelte: ['Del ponte', 'Del fondo', 'Del fianco'], giusta: 1, perche: 'Le ossature trasversali del fondo sono dette madieri.' },
    { n: 6, testo: 'Che cosa collega le costole ai madieri?', scelte: ['Le squadre o braccioli', 'Le anguille', 'I bagli'], giusta: 0, perche: 'Lamiere angolari dette squadre o braccioli.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  // Slide 6, 7, 8: zona, rinforzi ordinari, travi rinforzate trasversali e longitudinali
  const SISTEMI = {
    trasversale: {
      nome: 'Trasversale', testo: 'I fasciami sono irrigiditi da ossature trasversali. Generalmente per navi di piccola dimensione, normalmente sotto i 65 m. {{slide 6}}',
      tab: { fondo: ['Madieri', 'Madieri rinforzati', 'Paramezzali'], fianco: ['Costole', 'Costole rinforzate', '---'], ponte: ['Bagli', 'Bagli rinforzati', 'Anguille'] },
    },
    longitudinale: {
      nome: 'Longitudinale', testo: 'I fasciami sono irrigiditi da correnti longitudinali. Adatta alle navi di grandi dimensioni, soggette a elevati momenti flettenti. {{slide 7}}',
      tab: { fondo: ['Correnti longitudinali del fondo', 'Madieri rinforzati', 'Paramezzali'], fianco: ['Correnti longitudinali del fianco', 'Costole rinforzate', 'Correnti rinforzati del fianco'], ponte: ['Correnti longitudinali del ponte', 'Bagli rinforzati', 'Anguille'] },
    },
    mista: {
      nome: 'Mista', testo: 'Fianco con costole ordinarie, fondo e ponte con correnti longitudinali. Tipica delle grandi rinfusiere solide (*bulk carrier*). {{slide 8}}',
      tab: { fondo: ['Correnti longitudinali del fondo', 'Madieri rinforzati', 'Paramezzali'], fianco: ['Costole', '---', '---'], ponte: ['Correnti longitudinali del ponte', 'Bagli rinforzati', 'Anguille'] },
    },
  };
  const s = { sis: 'trasversale', zona: null, esploso: 0, meta: 0, visti: new Set(['trasversale']), fasciame: true };

  /* Tratto di scafo: 16 m di corpo centrale, misure solo grafiche */
  const LU = 16; const Y_DF = 1.2; const Y_P = 7.2; const ZF = 7.5;
  const passi = (a, b, d) => { const o = []; for (let v = a; v <= b + 0.001; v += d) o.push(v); return o; };
  const seg = (x0, y0, z0, x1, y1, z1, r) => segmento(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1), r);

  const ORD = 0.8; const FORTE = 3.2;
  function membrature(sis, zona, k, sg) {
    const o = []; const r1 = 0.035 * k; const r2 = 0.09 * k; const r3 = 0.14 * k;
    const t = SISTEMI[sis].tab[zona];
    const lungoOrd = t[0].startsWith('Correnti'); const haTr = t[1] !== '---'; const haLo = t[2] !== '---';
    if (zona === 'fondo') {
      if (lungoOrd) passi(-6.4, 6.4, ORD).forEach((z) => o.push(seg(0, Y_DF, z, LU, Y_DF, z, r1), seg(0, 0.05, z, LU, 0.05, z, r1)));
      else passi(0, LU, ORD).forEach((x) => o.push(seg(x, 0.6, -ZF + 0.3, x, 0.6, ZF - 0.3, r1)));
      if (haTr) passi(0, LU, FORTE).forEach((x) => { o.push(seg(x, 0, -ZF + 0.2, x, 0, ZF - 0.2, r2), seg(x, Y_DF, -ZF + 0.2, x, Y_DF, ZF - 0.2, r2)); passi(-6.4, 6.4, 3.2).forEach((z) => o.push(seg(x, 0, z, x, Y_DF, z, r2))); });
      if (haLo) [-3.5, 0, 3.5].forEach((z) => o.push(seg(0, 0, z, LU, 0, z, r3), seg(0, Y_DF, z, LU, Y_DF, z, r3), seg(0, 0, z, 0, Y_DF, z, r2), seg(LU, 0, z, LU, Y_DF, z, r2)));
    } else if (zona === 'fianco') {
      const z = sg * ZF;
      if (lungoOrd) passi(1.6, 6.4, ORD).forEach((y) => o.push(seg(0, y, z, LU, y, z, r1)));
      else passi(0, LU, ORD).forEach((x) => o.push(seg(x, Y_DF, z, x, Y_P, z, r1)));
      if (haTr) passi(0, LU, FORTE).forEach((x) => o.push(seg(x, Y_DF, z, x, Y_P, z, r2)));
      if (haLo) [3.2, 5.2].forEach((y) => o.push(seg(0, y, z, LU, y, z, r3)));
    } else {
      if (lungoOrd) passi(-6.4, 6.4, ORD).forEach((z) => o.push(seg(0, Y_P, z, LU, Y_P, z, r1)));
      else passi(0, LU, ORD).forEach((x) => o.push(seg(x, Y_P, -ZF, x, Y_P, ZF, r1)));
      if (haTr) passi(0, LU, FORTE).forEach((x) => o.push(seg(x, Y_P, -ZF, x, Y_P, ZF, r2)));
      if (haLo) [-3.5, 3.5].forEach((z) => o.push(seg(0, Y_P - 0.1, z, LU, Y_P - 0.1, z, r3)));
    }
    return o;
  }

  const copie = [];
  function lamiera(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }
  function copia(k) {
    const g = new THREE.Group();
    const zone = {};
    const matLam = new THREE.MeshBasicMaterial({ color: COL.scafo, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    const MAT = { fondo: new THREE.MeshBasicMaterial({ color: COL.inchiostro }), fianco: new THREE.MeshBasicMaterial({ color: COL.inchiostro }), ponte: new THREE.MeshBasicMaterial({ color: COL.inchiostro }) };
    [['fondo', 'fondo', 0], ['ponte', 'ponte', 0], ['dritta', 'fianco', 1], ['sinistra', 'fianco', -1]].forEach(([id, zona, sg]) => {
      const gz = new THREE.Group();
      const sistemi = {};
      Object.keys(SISTEMI).forEach((si) => {
        const ms = new THREE.Group();
        membrature(si, zona, k, sg).forEach((m) => ms.add(m));
        compatta(ms);
        ms.children.forEach((m) => { m.material = MAT[zona]; });
        sistemi[si] = ms; gz.add(ms);
      });
      const lam = new THREE.Group();
      if (zona === 'fondo') { [0, Y_DF].forEach((y) => { const l = lamiera(LU, 2 * ZF, matLam); l.rotation.x = -Math.PI / 2; l.position.set(LU / 2, y, 0); lam.add(l); }); } else if (zona === 'ponte') { const l = lamiera(LU, 2 * ZF, matLam); l.rotation.x = -Math.PI / 2; l.position.set(LU / 2, Y_P, 0); lam.add(l); } else { const l = lamiera(LU, Y_P - Y_DF, matLam); l.position.set(LU / 2, (Y_P + Y_DF) / 2, sg * (ZF + 0.02)); lam.add(l); }
      lam.children.forEach((l) => { l.userData.tocco = zona; prese[k > 1 ? 'mini' : 'schermo'].push(l); });
      gz.add(lam);
      g.add(gz);
      zone[id] = { gz, sistemi, lam };
    });
    const presa = maniglia(k > 1 ? 0.9 : 0.6, 'apri'); presa.position.set(LU / 2, Y_P + 1.6, 0); zone.ponte.gz.add(presa);
    prese[k > 1 ? 'mini' : 'schermo'].push(presa);
    const e1 = etichetta('prua →', k > 1 ? 1.6 : 1); e1.position.set(LU + 3, 2, 0); g.add(e1);
    copie.push({ g, zone, MAT });
    return g;
  }
  const prese = { schermo: [], mini: [] };

  function aggiorna() {
    copie.forEach((c) => {
      Object.values(c.zone).forEach((z) => {
        Object.keys(z.sistemi).forEach((si) => { z.sistemi[si].visible = si === s.sis; });
        z.lam.visible = s.fasciame;
      });
      Object.keys(c.MAT).forEach((id) => c.MAT[id].color.setHex(id === s.zona ? COL.ocra : COL.inchiostro));
    });
    Motore.sporco();
  }
  function apri(e) {
    copie.forEach((c) => {
      c.zone.fondo.gz.position.y = -3.5 * e; c.zone.ponte.gz.position.y = 3.5 * e;
      c.zone.dritta.gz.position.z = 4 * e; c.zone.sinistra.gz.position.z = -4 * e;
    });
  }

  const VISTA = () => ({ target: new THREE.Vector3(LU / 2, 3.4, 0), theta: 0.75, phi: 1.2, r: 38 });
  let mondo = null;
  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    const piano = new THREE.GridHelper(70, 35, COL.griglia, COL.griglia); piano.position.set(LU / 2, -3.2, 0);
    radice.add(piano, copia(1));
    const posto = (x, y, z, nome, yaw) => { const p = pedana(x, z, nome); p.scale.setScalar(0.22); p.position.y = y - 0.04; return { pedana: p, pos: new THREE.Vector3(x, y, z), yaw }; };
    const stazioni = [posto(LU / 2, Y_DF + 0.02, 0, 'dentro lo scafo', -Math.PI / 2), posto(LU + 6, 1.2, 0, 'davanti', Math.PI / 2), posto(LU / 2, -3.1, 15, 'di fianco', 0)];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const SC = 0.048; const mini = new THREE.Group();
    mini.add(copia(2.4)); mini.scale.setScalar(SC); mini.position.set((-LU / 2) * SC, -3.4 * SC, 0);
    aggiorna();
    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      tocchi: (v) => prese[v === 'mini' ? 'mini' : 'schermo'],
      trascina(id, dx, dy) {
        s.esploso = Math.max(0, Math.min(1, s.esploso - dy * 0.0035)); s.meta = s.esploso;
        apri(s.esploso);
        if (s.esploso > 0.6) lez.completa('esploso');
      },
      frame(dt) {
        if (Math.abs(s.meta - s.esploso) < 0.002) return false;
        s.esploso += (s.meta - s.esploso) * (1 - Math.exp(-dt * 2.5));
        apri(s.esploso);
        return true;
      },
    };
    return mondo;
  }

  function comandi(idTocco) {
    const id = idTocco.startsWith('t:') ? `z:${idTocco.slice(2).split(',')[0]}` : idTocco;
    if (id.startsWith('s:')) { s.sis = id.slice(2); s.visti.add(s.sis); if (s.visti.size === 3) lez.completa('tre'); }
    if (id.startsWith('z:')) { const z = id.slice(2); s.zona = s.zona === z ? null : z; }
    if (id === 'esplodi') { s.meta = s.meta ? 0 : 1; if (s.meta) lez.completa('esploso'); }
    if (id === 'lamiere') s.fasciame = !s.fasciame;
    if (s.sis === 'mista' && s.zona === 'fianco') lez.completa('mista');
    aggiorna();
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { tr: 'Trasversale', lo: 'Longitudinale', ug: 'Sono tutte uguali' };
    const si = SISTEMI[s.sis];
    const riga = (z, nome) => [nome, ...si.tab[z]];
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Lo scafo in acciaio' },
          { t: 'p', testo: 'Le ossature del corpo centrale si dividono in componenti **longitudinali**, da poppa a prua, e **trasversali**, da sinistra a dritta. {{slide 3}}' },
          { t: 'p', testo: 'In base a quali sono prevalenti, la nave è a struttura trasversale, longitudinale o mista. {{slide 3}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'tabella', col: [36, 64], size: 34, righe: [
            ['Sistema', 'Strutture'],
            ['Trasversale', 'fondo, fianco e ponte di tipo trasversale'],
            ['Longitudinale', 'fondo, fianco e ponte di tipo longitudinale'],
            ['Mista', 'fondo e ponte longitudinali, fianco trasversale'],
          ] },
          { t: 'nota', testo: 'slide 4' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Una nave molto lunga, sulle onde, si flette come una trave.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Quale struttura serve a una nave molto lunga?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:tr', testo: 'La trasversale', on: p === 'tr' },
          { t: 'scelta', id: 'p:lo', testo: 'La longitudinale', on: p === 'lo' },
          { t: 'scelta', id: 'p:ug', testo: 'Sono tutte uguali', on: p === 'ug' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Sistema strutturale' },
          { t: 'bottoni', h: 84, size: 30, lista: Object.keys(SISTEMI).map((k) => ({ id: `s:${k}`, testo: SISTEMI[k].nome, on: s.sis === k })) },
          { t: 'sotto', testo: 'Evidenzia' },
          { t: 'bottoni', h: 84, size: 30, lista: [['fondo', 'Fondo'], ['fianco', 'Fianco'], ['ponte', 'Ponte']].map(([k, n]) => ({ id: `z:${k}`, testo: n, on: s.zona === k })) },
          { t: 'bottoni', h: 84, size: 30, lista: [{ id: 'esplodi', testo: s.meta ? 'Richiudi' : 'Esplodi lo scafo', on: !!s.meta }, { id: 'lamiere', testo: s.fasciame ? 'Togli il fasciame' : 'Metti il fasciame' }] },
          { t: 'riquadro', size: 36, testo: si.testo },
          ...lez.missioni(),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 640,
            testo: !vr ? '' : vera
              ? 'Punta una pedana e premi il grilletto: puoi entrare dentro lo scafo.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'tabella', col: [16, 36, 24, 24], size: 30, righe: [['Zona', 'Rinforzi ordinari', 'Travi trasv.', 'Travi long.'], riga('fondo', 'Fondo'), riga('fianco', 'Fianco'), riga('ponte', 'Ponte')] },
          { t: 'nota', testo: 'Tocca fondo, fianco o ponte sul modello. Tira su la sfera d\'oro per aprire lo scafo. Tratto schematico.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'lo' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Nella longitudinale i correnti corrono da poppa a prua: tanti elementi lavorano insieme lungo tutta la nave.' },
        ],
        dx: [
          { t: 'titolo', testo: 'La longitudinale' },
          { t: 'p', testo: 'È particolarmente adatta alle navi di grandi dimensioni, soggette a elevati momenti flettenti: si realizzano robustezze longitudinali maggiori a parità di peso scafo. {{slide 7}}' },
          { t: 'p', testo: 'Lo svantaggio è il notevole ingombro delle costole rinforzate, che può interferire con la caricazione. {{slide 7}}' },
          { t: 'p', testo: 'Per navi medio-grandi si prediligono i sistemi longitudinale o misto. {{slide 6}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Ossature longitudinali' },
          { t: 'p', size: 38, testo: 'Le ossature longitudinali per eccellenza sono i **paramezzali**, nel doppio fondo: uno centrale continuo, una o più coppie laterali intercostali. {{slide 10}}' },
          { t: 'p', size: 38, testo: 'Il paramezzale centrale è collegato alla **chiglia** (*keel*): oggi piatta o a galleria (a tunnel). {{slide 11}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Ossature trasversali' },
          { t: 'p', size: 36, testo: 'Madieri, costole, squadre, bagli, correnti di sottoponte e anguille. {{slide 13}}' },
          { t: 'p', size: 36, testo: '**Madiere pieno**: lamiera dal paramezzale centrale al ginocchio, alleggerita con fori e passi d\'uomo (*manhole*). **Aperto o a telaio**: solo vicino a paramezzale e ginocchio. **Stagno**: lamiera integra. {{slide 14, 15}}' },
          { t: 'p', size: 36, testo: '**Costole**: lungo i fianchi; collegate ai madieri da **squadre o braccioli**. {{slide 17}}' },
          { t: 'p', size: 36, testo: '**Bagli**: sostengono i ponti; si incrociano con i correnti di sottoponte, quelli più spessi detti **anguille**. {{slide 18}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Le estremità' },
          { t: 'p', size: 38, testo: 'Il **dritto di prua** (asta o ruota di prua) è l\'elemento a prua, collegato inferiormente alla chiglia. {{slide 19}}' },
          { t: 'p', size: 38, testo: 'Il **dritto di poppa** è il telaio collegato alla chiglia, dove si uniscono le strutture di dritta e di sinistra. Contiene la parte finale del tubo dell\'elica. {{slide 20, 21}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Le navi bulk' },
          { t: 'p', size: 38, testo: 'Nelle bulk gli elementi creano spazi a sezione triangolare, le **casse**, alle estremità laterali. {{slide 18}}' },
          { t: 'p', size: 38, testo: 'La struttura mista offre buona resistenza flessionale e non intralcia carico e scarico. {{slide 8}}' },
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
