/* Lezione 5: scafo in legno. Ordine di costruzione dalla slide 5, nomi dalle slide 8-13.
   Forma e misure dello scafo sono schematiche */
(function () {
  const N = 5;
  const { COL, tratto, etichetta, pedana, compatta } = Tavola;
  const { griglia } = Scafo;

  const MISSIONI = [
    { id: 'ordine', testo: 'Monta lo scafo nell\'ordine giusto.' },
    { id: 'pezzi', testo: 'Trova madiere, staminale e scalmo in un\'ordinata.' },
    { id: 'lunghi', testo: 'Trova paramezzale, dormiente e trincarino.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Quale pezzo si imposta per primo?', scelte: ['Il fasciame', 'La chiglia', 'Il baglio'], giusta: 1, perche: 'Il primo pezzo che si imposta è la chiglia.' },
    { n: 2, testo: 'L\'incastro che unisce più travi della chiglia si chiama…', scelte: ['Parella', 'Madiere', 'Scalmo'], giusta: 0, perche: 'È la parella.' },
    { n: 3, testo: 'La parte centrale e più robusta dell\'ordinata è…', scelte: ['Lo scalmo', 'Lo staminale', 'Il madiere'], giusta: 2, perche: 'È il madiere, che si incastra nella chiglia.' },
    { n: 4, testo: 'Che cosa sostiene i ponti?', scelte: ['Il baglio', 'La sottochiglia', 'Il prestantino'], giusta: 0, perche: 'Il baglio, trave a sezione quadra.' },
    { n: 5, testo: 'Il pezzo che sorregge le teste dei bagli è…', scelte: ['Il paramezzale', 'Il dormiente', 'Il puntello'], giusta: 1, perche: 'Il dormiente, posto contro le murate, internamente.' },
    { n: 6, testo: 'Il calafataggio serve a…', scelte: ['Irrobustire la chiglia', 'Impermeabilizzare lo scafo', 'Sostenere i ponti'], giusta: 1, perche: 'Rende stagna la struttura: stoppa tra le tavole e pece liquida sopra.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  // Ordine della slide 5
  const FASI = [
    { id: 'chiglia', nome: 'Chiglia', testo: 'Il primo pezzo che si imposta è la **chiglia**: robusta trave di legno che corre lungo il fondo, da poppa a prua, senza interruzioni. {{slide 5, 8}}', dopo: null },
    { id: 'ordinate', nome: 'Ordinate o coste', testo: 'Sulla chiglia si fissano trasversalmente **ordinate o coste**, come costole, a breve e regolare distanza. {{slide 5, 9}}', dopo: 'la chiglia' },
    { id: 'fasciame', nome: 'Fasciame', testo: 'Sulle coste viene posto il **fasciame**, il rivestimento esterno dello scafo. {{slide 4, 5}}', dopo: 'le ordinate' },
    { id: 'calafataggio', nome: 'Calafataggio', testo: 'Per rendere stagna la struttura si esegue il **calafataggio**: stoppa ben pressata tra le tavole e pece liquida sopra. {{slide 5, 13}}', dopo: 'il fasciame' },
  ];
  // Slide 8-11
  const PEZZI = {
    sottochiglia: { nome: 'Sottochiglia', testo: '**Sottochiglia**: asse più piccola applicata sotto la chiglia, per proteggerla da urti e usura. {{slide 8}}' },
    madiere: { nome: 'Madiere', testo: '**Madiere**: la parte centrale e più robusta dell\'ordinata, che si incastra nella chiglia. {{slide 9}}' },
    staminale: { nome: 'Staminale', testo: '**Staminale**: la parte curva che si raccorda con lo scalmo; oggi si chiama anche ginocchio. {{slide 9}}' },
    scalmo: { nome: 'Scalmo', testo: '**Scalmotto o scalmo**: la parte verticale immediatamente seguente lo staminale. {{slide 9}}' },
    baglio: { nome: 'Baglio', testo: '**Baglio**: trave a sezione quadra che serve a sostenere i ponti. {{slide 9}}' },
    paramezzale: { nome: 'Paramezzale', testo: '**Paramezzale**: trave simile alla chiglia, interna e sovrapposta al madiere: dà robustezza longitudinale. {{slide 10}}' },
    dormiente: { nome: 'Dormiente', testo: '**Dormiente**: pezzo longitudinale contro le murate, internamente, che sorregge le teste dei bagli. {{slide 11}}' },
    trincarino: { nome: 'Trincarino', testo: '**Trincarino**: pezzo longitudinale sopra i bagli, che ne incastra le teste con il dormiente. {{slide 11}}' },
    puntelli: { nome: 'Puntelli', testo: '**Puntelli**: travi verticali che sostengono al centro i bagli e poggiano sul paramezzale. {{slide 11}}' },
  };

  const s = { fatti: 0, errore: '', dettaglio: null, testo: null, visti: new Set() };

  /* Forma schematica, appuntita alle due estremità */
  const L = 24; const B = 6; const D = 3;
  const larghezza = (u) => (B / 2) * Math.max(0, 1 - Math.abs(2 * u - 1) ** 2.6) ** 0.7;
  const orlo = (u) => D + 0.8 * Math.abs(2 * u - 1) ** 2.2;
  function punto(u, v, dz = 0) {
    return new THREE.Vector3(L * u, 0.35 + v * orlo(u), (larghezza(u) * v ** 0.55 + dz) * 1);
  }
  const lato = (p, sg) => new THREE.Vector3(p.x, p.y, sg * p.z);

  function legno(materiale, oggetti) {
    const g = new THREE.Group();
    oggetti.forEach((o) => g.add(o));
    compatta(g);
    g.children.forEach((m) => { m.material = materiale; });
    return g;
  }

  const copie = [];
  function copia(k) {
    const r = 0.045 * k;
    const M = {}; const mat = (id) => (M[id] = new THREE.MeshBasicMaterial({ color: LEGNO }));
    const parti = {};
    const trave = (x0, x1, y, h, l) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, l), new THREE.MeshBasicMaterial({ color: LEGNO }));
      m.position.set((x0 + x1) / 2, y, 0);
      return m;
    };

    parti.chiglia = new THREE.Group();
    const kel = trave(0, L, 0.18, 0.34, 0.3); kel.material = mat('chiglia'); parti.chiglia.add(kel);
    parti.sottochiglia = new THREE.Group();
    const sot = trave(0, L, -0.05, 0.12, 0.26); sot.material = mat('sottochiglia'); parti.sottochiglia.add(sot);

    const pezziOrd = { madiere: [], staminale: [], scalmo: [] };
    for (let i = 1; i < 16; i++) {
      const u = i / 16;
      [1, -1].forEach((sg) => {
        const tratti = (a, b) => { const p = []; for (let t = 0; t <= 6; t++) p.push(lato(punto(u, a + (t / 6) * (b - a)), sg)); return p; };
        pezziOrd.madiere.push(tratto(tratti(0, 0.2), r * 1.3));
        pezziOrd.staminale.push(tratto(tratti(0.2, 0.55), r));
        pezziOrd.scalmo.push(tratto(tratti(0.55, 1), r * 0.85));
      });
    }
    parti.madiere = legno(mat('madiere'), pezziOrd.madiere);
    parti.staminale = legno(mat('staminale'), pezziOrd.staminale);
    parti.scalmo = legno(mat('scalmo'), pezziOrd.scalmo);

    const bagli = [];
    for (let i = 2; i < 15; i += 2) { const u = i / 16; const a = punto(u, 0.97); bagli.push(tratto([new THREE.Vector3(a.x, a.y, a.z), new THREE.Vector3(a.x, a.y + 0.1, 0), new THREE.Vector3(a.x, a.y, -a.z)], r)); }
    parti.baglio = legno(mat('baglio'), bagli);
    parti.paramezzale = new THREE.Group();
    const par = trave(0.5, L - 0.5, 0.48, 0.22, 0.24); par.material = mat('paramezzale'); parti.paramezzale.add(par);
    const lungo = (v, dz) => [1, -1].map((sg) => { const p = []; for (let i = 1; i < 16; i++) { const q = lato(punto(i / 16, v), sg); q.z -= sg * dz; p.push(q); } return tratto(p, r); });
    parti.dormiente = legno(mat('dormiente'), lungo(0.93, 0.18));
    parti.trincarino = legno(mat('trincarino'), lungo(1, 0.16));
    const pun = [];
    for (let i = 3; i < 14; i += 2) { const a = punto(i / 16, 0.97); pun.push(tratto([new THREE.Vector3(a.x, 0.55, 0), new THREE.Vector3(a.x, (0.55 + a.y) / 2, 0), new THREE.Vector3(a.x, a.y, 0)], r * 0.8)); }
    parti.puntelli = legno(mat('puntelli'), pun);

    // Fasciame a corsi di tavole, su entrambi i lati
    const fasciame = new THREE.Group(); const giunti = [];
    const NC = 9;
    for (let c = 0; c < NC; c++) {
      [1, -1].forEach((sg) => {
        const geo = griglia(32, 2, (a, b) => {
          const u = 0.012 + a * 0.976; const v = ((c + b * 0.94) / NC) * 0.99 + 0.012; const p = punto(u, v, 0.04);
          return [p.x, p.y, sg * p.z];
        });
        fasciame.add(new THREE.Mesh(Tavola.cuoci(geo, ['#A9763F', '#B5854E', '#9C6B38'][c % 3], true), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
        const riga = []; for (let i = 0; i <= 40; i++) { const u = 0.012 + (i / 40) * 0.976; const p = punto(u, (c / NC) * 0.99 + 0.012, 0.07); riga.push(new THREE.Vector3(p.x, p.y, sg * p.z)); }
        giunti.push(tratto(riga, 0.018 * k));
        fasciame.add(tratto(riga.map((q) => q.clone()), 0.012 * k, COL.medio));
      });
    }
    const matCal = new THREE.MeshBasicMaterial({ color: COL.ocra });
    const calafataggio = legno(matCal, giunti);
    parti.fasciame = fasciame; parti.calafataggio = calafataggio;

    const g = new THREE.Group();
    Object.keys(parti).forEach((id) => g.add(parti[id]));
    Object.keys(PEZZI).forEach((id) => parti[id].children.forEach((m) => { m.userData.tocco = id; pezziToccabili[k > 1 ? 'mini' : 'schermo'].push(m); }));
    copie.push({ g, parti, M });
    return g;
  }
  const LEGNO = 0x7A4E2D;
  const pezziToccabili = { schermo: [], mini: [] };

  function visibili() {
    const f = s.fatti;
    const ord = ['madiere', 'staminale', 'scalmo', 'baglio', 'paramezzale', 'dormiente', 'trincarino', 'puntelli'];
    copie.forEach((c) => {
      c.parti.chiglia.visible = f >= 1; c.parti.sottochiglia.visible = f >= 1;
      ord.forEach((id) => { c.parti[id].visible = f >= 2; });
      c.parti.fasciame.visible = f >= 3 && !s.dettaglio;
      c.parti.calafataggio.visible = f >= 4 && !s.dettaglio;
      Object.keys(c.M).forEach((id) => c.M[id].color.setHex(id === s.dettaglio || id === s.sopra ? COL.ocra : LEGNO));
    });
  }

  const VISTA = () => ({ target: new THREE.Vector3(L / 2, 1.6, 0), theta: 0.7, phi: 1.2, r: 34 });
  let mondo = null; let entra = { fatti: -1, t: 1 };
  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    const piano = new THREE.GridHelper(70, 35, COL.griglia, COL.griglia); piano.position.set(L / 2, -1.2, 0);
    const scafo = copia(1); scafo.position.y = -0.6;
    radice.add(piano, scafo);
    [['prua', L + 2.5, 3, 0], ['poppa', -2.5, 3, 0]].forEach(([t, x, y, z]) => { const e = etichetta(t, 1); e.position.set(x, y, z); radice.add(e); });
    const stazione = (x, z, nome, yaw) => { const p = pedana(x, z, nome); p.scale.setScalar(0.3); p.position.y = -1.15; return { pedana: p, pos: new THREE.Vector3(x, -1.1, z), yaw }; };
    const stazioni = [stazione(L / 2, 9, 'di fianco', 0), stazione(L + 8, 0, 'a prua', Math.PI / 2), stazione(-8, 0, 'a poppa', -Math.PI / 2)];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const SC = 0.045; const mini = new THREE.Group();
    mini.add(copia(2.6)); mini.scale.setScalar(SC); mini.position.set((-L / 2) * SC, -1.6 * SC, 0);
    visibili();
    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      // I pezzi si toccano solo a ossatura montata e col fasciame tolto: dentro non si vedrebbero
      tocchi: (v) => (s.fatti >= 2 && (s.fatti < 3 || s.dettaglio) ? pezziToccabili[v === 'mini' ? 'mini' : 'schermo'] : []),
      sopra(ids) {
        const id = ids ? ids[0] : null;
        if (id === s.sopra) return false;
        s.sopra = id; visibili();
        return true;
      },
      frame(dt) {
        if (entra.t >= 1) return false;
        // Il pezzo appena montato scende al suo posto
        entra.t = Math.min(1, entra.t + dt / 0.9);
        const y = (1 - entra.t) ** 2 * 3.5;
        copie.forEach((c) => {
          // Un pezzo nuovo può partire prima che il precedente sia arrivato: tutti gli altri restano al loro posto
          Object.values(c.parti).forEach((o) => { o.position.y = 0; });
          const lista = entra.fatti === 1 ? ['chiglia', 'sottochiglia'] : entra.fatti === 3 ? ['fasciame'] : entra.fatti === 4 ? ['calafataggio'] : ['madiere', 'staminale', 'scalmo', 'baglio', 'paramezzale', 'dormiente', 'trincarino', 'puntelli'];
          lista.forEach((id) => { c.parti[id].position.y = y; });
        });
        return true;
      },
    };
    return mondo;
  }

  function comandi(idTocco) {
    const id = idTocco.startsWith('t:') ? `d:${idTocco.slice(2).split(',')[0]}` : idTocco;
    if (id.startsWith('m:')) {
      const i = FASI.findIndex((f) => f.id === id.slice(2));
      s.dettaglio = null;
      if (i < s.fatti) { s.errore = ''; s.testo = FASI[i].testo; } else if (i > s.fatti) { s.errore = `Non ancora: prima serve ${FASI[s.fatti].id === 'chiglia' ? 'la chiglia' : FASI[i].dopo}.`; } else {
        s.fatti = i + 1; s.errore = ''; s.testo = FASI[i].testo; entra = { fatti: s.fatti, t: 0 };
        if (s.fatti === 4) lez.completa('ordine');
      }
    }
    if (id.startsWith('d:')) {
      const p = id.slice(2);
      s.dettaglio = s.dettaglio === p ? null : p; s.errore = '';
      if (s.dettaglio) { s.testo = PEZZI[p].testo; s.visti.add(p); }
      if (['madiere', 'staminale', 'scalmo'].every((x) => s.visti.has(x))) lez.completa('pezzi');
      if (['paramezzale', 'dormiente', 'trincarino'].every((x) => s.visti.has(x))) lez.completa('lunghi');
    }
    if (id === 'smonta') { s.fatti = 0; s.dettaglio = null; s.errore = ''; s.testo = null; }
    visibili();
    Motore.sporco();
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { chiglia: 'La chiglia', fasciame: 'Il fasciame', baglio: 'I bagli' };
    const righe = (ids) => ({ t: 'bottoni', h: 72, size: 28, lista: ids.map((k) => ({ id: `d:${k}`, testo: PEZZI[k].nome, on: s.dettaglio === k, off: s.fatti < 2 })) });
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Lo scafo in legno' },
          { t: 'p', testo: 'Lo **scafo** è l\'insieme degli elementi costruttivi che costituiscono l\'involucro stagno e la parte resistente della nave. {{slide 4}}' },
          { t: 'p', testo: 'La sua struttura ricorda il corpo umano: le ossature portanti sono ricoperte da un fasciame, un po\' come farebbe la pelle. {{slide 4}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'L\'**ossatura** è la struttura portante della nave, composta da elementi trasversali e longitudinali. {{slide 4}}' },
          { t: 'p', testo: 'Il **fasciame** è il rivestimento esterno dello scafo. {{slide 4}}' },
          { t: 'p', testo: 'Il processo di costruzione di uno scafo in legno è concettualmente semplice. {{slide 5}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Il cantiere è vuoto: bisogna impostare il primo pezzo dello scafo.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Cosa si monta per primo?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:chiglia', testo: 'La chiglia', on: p === 'chiglia' },
          { t: 'scelta', id: 'p:fasciame', testo: 'Il fasciame', on: p === 'fasciame' },
          { t: 'scelta', id: 'p:baglio', testo: 'I bagli', on: p === 'baglio' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Che cosa monti adesso?' },
          { t: 'bottoni', h: 80, size: 30, lista: FASI.slice(0, 2).map((f, i) => ({ id: `m:${f.id}`, testo: f.nome, on: s.fatti > i })) },
          { t: 'bottoni', h: 80, size: 30, lista: FASI.slice(2).map((f, i) => ({ id: `m:${f.id}`, testo: f.nome, on: s.fatti > i + 2 })) },
          ...(s.errore ? [{ t: 'esito', tipo: 'errato', testo: s.errore }] : []),
          { t: 'sotto', testo: 'Esplora la struttura' },
          righe(['sottochiglia', 'madiere', 'staminale']),
          righe(['scalmo', 'baglio', 'paramezzale']),
          righe(['dormiente', 'trincarino', 'puntelli']),
          ...lez.missioni(),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 740,
            testo: !vr ? '' : vera
              ? 'Sei in cantiere, accanto allo scafo. Punta una pedana e premi il grilletto per spostarti.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'bottoni', h: 76, size: 32, lista: [{ id: 'smonta', testo: 'Smonta e ricomincia' }] },
          { t: 'riquadro', size: 36, testo: s.testo || 'Scegli il primo pezzo da montare.' },
          { t: 'nota', testo: 'Tocca un pezzo sull\'ossatura: si accende e ne leggi il nome. Disegno schematico.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'chiglia' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Senza la chiglia non si può fissare nulla: ogni pezzo poggia su quello prima.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Prima la chiglia' },
          { t: 'p', testo: 'Il primo pezzo che si imposta è la **chiglia**. {{slide 5}}' },
          { t: 'p', testo: 'Su di essa vengono fissate trasversalmente **ordinate o coste** e sulle coste viene posto il **fasciame**. {{slide 5}}' },
          { t: 'p', testo: 'Per rendere stagna questa struttura viene eseguito il **calafataggio**. {{slide 5}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'La chiglia' },
          { t: 'p', size: 40, testo: 'È una robusta trave di legno a sezione rettangolare. Se la nave è molto grande si costruisce con più travi, unite da un incastro detto **parella**. {{slide 8}}' },
          { t: 'p', size: 40, testo: 'Sotto si applica la **sottochiglia**, che la protegge da urti e usura. {{slide 8}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Elementi trasversali' },
          { t: 'tabella', col: [34, 66], size: 32, righe: [
            ['Pezzo', 'Che cos\'è'],
            ['Ordinate o coste', 'strutture a forma di costole, incastrate sulla chiglia'],
            ['Madiere', 'parte centrale dell\'ordinata, la più robusta'],
            ['Staminale', 'parte curva che si raccorda con lo scalmo'],
            ['Scalmotto o scalmo', 'parte verticale dopo lo staminale'],
            ['Baglio', 'trave a sezione quadra che sostiene i ponti'],
          ] },
          { t: 'nota', testo: 'slide 9' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Elementi longitudinali' },
          { t: 'tabella', col: [34, 66], size: 32, righe: [
            ['Pezzo', 'Che cos\'è'],
            ['Paramezzale', 'trave interna, sovrapposta al madiere'],
            ['Prestantino', 'il paramezzale che si incurva a poppa e a prua'],
            ['Sopraparamezzale', 'asse al di sopra del paramezzale'],
            ['Dormiente', 'contro le murate: sorregge le teste dei bagli'],
            ['Trincarino', 'sopra i bagli, sulle murate'],
          ] },
          { t: 'nota', testo: 'slide 10, 11' },
          { t: 'p', size: 36, testo: 'Elementi verticali: i **puntelli**. {{slide 11}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Il calafataggio' },
          { t: 'p', size: 38, testo: 'Consente l\'impermeabilizzazione dello scafo: tra le tavole si incastra stoppa (fili di canapa) ben pressata e vi si cola sopra pece liquida. {{slide 13}}' },
          { t: 'p', size: 38, testo: 'Oggi si usano stucchi a base di resine sintetiche. Contro vegetazione e «denti di cane» la carena si vernicia con vernici antivegetative. {{slide 13}}' },
          { t: 'sotto', testo: 'Tre strutture' },
          { t: 'p', size: 36, testo: 'In base ai componenti prevalenti: struttura trasversale, longitudinale o mista. {{slide 6}}' },
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
